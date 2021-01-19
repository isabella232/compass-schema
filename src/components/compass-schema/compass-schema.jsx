/* eslint react/no-multi-comp:0 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StatusRow, Tooltip, ZeroState } from 'hadron-react-components';
import { TextButton } from 'hadron-react-buttons';
import Field from 'components/field';
import SamplingMessage from 'components/sampling-message';
import ZeroGraphic from 'components/zero-graphic';
import CONSTANTS from 'constants/schema';
import includes from 'lodash.includes';
import get from 'lodash.get';
import classnames from 'classnames';

import styles from './compass-schema.less';
import SchemaSteps from '../steps/steps';
import ButtonsWaiting from '../buttons-waiting/buttons-waiting';

// TODO: Durran
// const QUERYBAR_LAYOUT = ['filter', ['project', 'limit', 'maxTimeMs']];

const OUTDATED_WARNING = 'The schema content is outdated and no longer in sync'
  + ' with the documents view. Press "Analyze" again to see the schema for the'
  + ' current query.';

const ERROR_WARNING = 'An error occurred during schema analysis';

const HEADER = 'Explore your schema';

const SUBTEXT = 'Quickly visualize your schema to understand the frequency, types and ranges of'
  + '\xa0fields in your data set.';

const DOCUMENTATION_LINK = 'https://docs.mongodb.com/compass/master/schema/';

const INCREASE_MAX_TIME_MS_HINT = 'Operation exceeded time limit. Please try increasing the maxTimeMS for the query in the filter options.';

/**
 * Component for the entire schema view component.
 */
class Schema extends Component {
  static displayName = 'SchemaComponent';

  static propTypes = {
    actions: PropTypes.object,
    store: PropTypes.object.isRequired,
    samplingState: PropTypes.oneOf([
      'initial',
      'sampling',
      'analyzing',
      'error',
      'complete',
      'outdated',
      'timeout'
    ]),
    samplingTimeMS: PropTypes.number,
    errorMessage: PropTypes.string,
    maxTimeMS: PropTypes.number,
    schema: PropTypes.any,
    count: PropTypes.number
  }

  constructor(props) {
    super(props);
    const appRegistry = props.store.localAppRegistry;
    this.queryBarRole = appRegistry.getRole('Query.QueryBar')[0];
    this.queryBar = this.queryBarRole.component;
    this.queryBarStore = appRegistry.getStore(this.queryBarRole.storeName);
    this.queryBarActions = appRegistry.getAction(this.queryBarRole.actionName);
  }

  componentDidUpdate() {
    // when the namespace changes and the schema tab is not active, the
    // tab is "display:none" and its width 0. That also means the the minichart
    // auto-sizes to 0. Therefore, when the user switches back to the tab,
    // making it "display:block" again and giving it a proper non-zero size,
    // the minicharts have to be re-rendered.
    //
    // if (this.CollectionStore.getActiveTab() === 1) {
    //   this.props.actions.resizeMiniCharts();
    //   ReactTooltip.rebuild();
    // }
  }

  onApplyClicked() {
    this.props.actions.startSampling();
  }

  onResetClicked() {
    this.props.actions.startSampling();
  }

  onOpenLink(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const { shell } = require('electron');
    shell.openExternal(DOCUMENTATION_LINK);
  }

  renderBanner() {
    const samplingState = this.props.samplingState;

    if (samplingState === 'outdated') {
      return <StatusRow style="warning">{OUTDATED_WARNING}</StatusRow>;
    }

    if (samplingState === 'error') {
      return <StatusRow style="error">{ERROR_WARNING}: {this.props.errorMessage}</StatusRow>;
    }

    if (samplingState === 'timeout') {
      return <StatusRow style="warning">{INCREASE_MAX_TIME_MS_HINT}</StatusRow>;
    }

    if (samplingState === 'complete') {
      return (
        <SamplingMessage
          sampleSize={this.props.schema ? this.props.schema.count : 0} />
      );
    }

    return null;
  }

  renderFieldList() {
    let fieldList = null;
    if (includes(['outdated', 'complete'], this.props.samplingState)) {
      fieldList = get(this.props.schema, 'fields', []).map((field) => {
        return (
          <Field
            key={field.name}
            actions={this.props.actions}
            localAppRegistry={this.props.store.localAppRegistry}
            {...field} />
        );
      });
    }
    return fieldList;
  }

  renderInitialScreen() {
    return (
      <div className={classnames(styles['schema-zero-state'])}>
        <ZeroGraphic />
        <ZeroState
          header={HEADER}
          subtext={SUBTEXT}>
          <div className={classnames(styles['schema-zero-state-action'])}>
            <div>
              <TextButton
                className="btn btn-primary btn-lg"
                text="Analyze Schema"
                clickHandler={this.onApplyClicked.bind(this)} />
            </div>
          </div>
          <a className={classnames(styles['schema-zero-state-link'])} onClick={this.onOpenLink.bind(this)}>
          Learn more about schema analysis in Compass
          </a>
        </ZeroState>
      </div>
    );
  }

  renderStepsScreen() {
    return (<div id="schema-status-subview">
      <div id="schema-status-subview">
        <SchemaSteps
          samplingState={this.props.samplingState}
          actions={this.props.actions} />
      </div>
    </div>);
  }

  /**
   * Renders the zero state during the initial state; renders the schema if not.
   * @returns {React.Component} Zero state or fields.
   */
  renderContent() {
    if (this.props.samplingState === 'initial') {
      return (
        this.renderInitialScreen()
      );
    }

    if (
      this.props.samplingState === 'sampling' ||
      this.props.samplingState === 'analyzing'
    ) {
      return (
        this.renderStepsScreen()
      );
    }

    return (
      <div className="column-container">
        <div className="column main">
          <div className="schema-field-list">
            {this.renderFieldList()}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render the schema
   *
   * @returns {React.Component} The schema view.
   */
  render() {
    return (
      <div className={classnames(styles.root)}>
        <div className="controls-container">
          <this.queryBar
            store={this.queryBarStore}
            actions={this.queryBarActions}
            buttonLabel="Analyze"
            onApply={this.onApplyClicked.bind(this)}
            onReset={this.onResetClicked.bind(this)}
          />
          {this.renderBanner()}
        </div>
        {this.renderContent()}
        <Tooltip
          id={CONSTANTS.SCHEMA_PROBABILITY_PERCENT}
          className="opaque-tooltip" />
      </div>
    );
  }
}

export default Schema;
