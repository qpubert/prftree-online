import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Split from 'react-split';
import { MathComponent } from 'mathjax-react';
import { v4 as uuidv4 } from 'uuid';
import clone from 'clone';
import deepEqual from 'deep-equal';
import './index.css';

class InputPane extends React.Component {
  render() {
    const undoDisabled = (this.props.onUndo === false);
    const redoDisabled = (this.props.onRedo === false);

    const inputPane = (
      <div
        className="input-pane pane"
        onClick={this.props.onViewClick}
      >
        <div id="history-buttons">
          <button
            onClick={undoDisabled ? undefined : this.props.onUndo}
            disabled={undoDisabled}
          >Undo</button>
          <button
            onClick={redoDisabled ? undefined : this.props.onRedo}
            disabled={redoDisabled}
          >Redo</button>
        </div>
        <div className="tree-wrapper">
          {this.props.rootNode}
        </div>
      </div>
    );

    return (
      <Split
        className="left-pane"
        sizes={[80, 20]}
        minSize={0}
        expandToMin={false}
        gutterSize={10}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={1}
        direction="vertical"
        cursor="row-resize"
      >
        {inputPane}
        <textarea
          className="error-message-pane pane"
          value={this.props.errorMsg}
          readOnly
        />
      </Split>
    );
  }
}

InputPane.propTypes = {
  rootNode: PropTypes.object.isRequired,
  errorMsg: PropTypes.string.isRequired,
  onViewClick: PropTypes.func.isRequired,
  onUndo: PropTypes.any.isRequired,
  onRedo: PropTypes.any.isRequired,
}

class OutputPane extends React.Component {
  render() {
    return (
      <textarea
        className="output-pane pane"
        value={this.props.outputSource}
        readOnly
      />
    )
  }
}

OutputPane.propTypes = {
  outputSource: PropTypes.string.isRequired,
}

class LiveEditor extends React.Component {
  constructor(props) {
    super(props);
    this.currentLatexInputRef = React.createRef();
    this.state = {
      history: [this.createBlankNode()],
      currentVersion: 0,
      focusedInputId: null,
      focusWasPerformed: false,
    };
  }

  createBlankNode(parentId) {
    return {
      parentId: parentId,
      id: uuidv4(),

      assumptions: [],
      labelInput: this.createBlankLatexInput(),
      ruleNameInput: this.createBlankLatexInput(),
      conclusionInput: this.createBlankLatexInput(),

      lineType: 'straight',
      lineDoubled: false
    };
  }

  createBlankLatexInput(initialValue = '') {
    return {
      id: uuidv4(),
      value: initialValue,
      errorMsg: ''
    };
  }

  findNodeRec(currentNode, pred) {
    if (pred(currentNode)) {
      return currentNode;
    } else {
      for (const ass of currentNode.assumptions) {
        const result = this.findNodeRec(ass, pred);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }

  findLatexInputRec(rootNode, pred) {
    const candidateNode = this.findNodeRec(rootNode, (currNode) => {
      return [
        currNode.labelInput, 
        currNode.ruleNameInput, 
        currNode.conclusionInput
      ].findIndex(pred) !== -1;
    });

    if (candidateNode === undefined)
      return;

    return [
      candidateNode.labelInput, 
      candidateNode.ruleNameInput, 
      candidateNode.conclusionInput
    ].find(pred); 
  }

  updateNodeStateOnEvent(save, nodeId, func) {
    return (event) => {
      const rootNodeNewVersion = clone(this.state.history[this.state.currentVersion]);

      func(
        this.findNodeRec(rootNodeNewVersion, currNode => currNode.id === nodeId),
        event);

      this.setState((state) => ({
        history: save ?
          state.history.slice(0, state.currentVersion + 1).concat([rootNodeNewVersion]) :
          state.history.map((version, versionIndex) => {
            if (versionIndex === state.currentVersion) {
              return rootNodeNewVersion;
            } else {
              return version;
            }
          }),
        currentVersion: save ?
          state.currentVersion + 1 :
          state.currentVersion
      })
      );
    };
  }

  updateLatexInputStateOnEvent(save, nodeId, latexInputId, func) {
    return this.updateNodeStateOnEvent(save, nodeId, (newNodeVersion, event) => {
      func(this.findLatexInputRec(newNodeVersion, li => li.id === latexInputId), event);
    });
  }

  renderLatexInput(node, latexInput, smallTextModeEnabled = true) {
    const dots = smallTextModeEnabled ? '□' : '□';
    const focused = this.state.focusedInputId && latexInput.id == this.state.focusedInputId;
    const latexHidden = focused || latexInput.errorMsg !== '';
    const justFocused = focused && (!this.state.focusWasPerformed);

    return (
      <div
        className='latex-input-wrapper'
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div
          className='latex-input-output'
          tabIndex={0}
          onFocus={(_) => {
            this.setState({
              focusedInputId: latexInput.id,
              focusWasPerformed: false,
            });
          }}
          hidden={latexHidden}
        >
          <MathComponent
            display={false}
            tex={smallTextModeEnabled ?
              `\\small{\\text{${latexInput.value.length === 0 ? dots : latexInput.value}}}` :
              `${latexInput.value.length === 0 ? dots : latexInput.value}`
            }
            onError={this.updateLatexInputStateOnEvent(false, node.id, latexInput.id, (newLIVer, errorMsg) => {
              debugger;
              newLIVer.errorMsg = errorMsg;
            })}
            onSuccess={this.updateLatexInputStateOnEvent(false, node.id, latexInput.id, (newLIVer, _) => {
              newLIVer.errorMsg = '';
            })}
          />
        </div>
        {latexHidden && <div className='latex-input-input'>
          <input
            className={latexInput.errorMsg === '' ? '' : 'invalid-latex-input'}
            type='text'
            placeholder={dots}
            defaultValue={latexInput.value}
            style={{ width: `${Math.max(dots.length, latexInput.value.length)}ch` }}
            onInput={this.updateLatexInputStateOnEvent(false, node.id, latexInput.id, (newLIVer, event) => {
              newLIVer.value = event.target.value;
            })}
            ref={focused ? this.currentLatexInputRef : null}
            onFocus={this.updateLatexInputStateOnEvent(justFocused, node.id, latexInput.id, (newLIVer, event) => {
              this.setState({
                focusedInputId: latexInput.id,
              });
            })}
            onBlur={(event) => {
              if (deepEqual(
                this.state.history[this.state.currentVersion],
                this.state.history[this.state.currentVersion - 1]
              )) {
                this.setState((state) => ({
                  history: state.history.filter((_, index) => (index !== state.currentVersion)),
                  currentVersion: state.currentVersion - 1
                }));
              }
            }}
          />
        </div>}
      </div>
    );
  }

  componentDidUpdate() {
    if (this.currentLatexInputRef.current && !this.state.focusWasPerformed) {
      this.currentLatexInputRef.current.focus();
      this.currentLatexInputRef.current.setSelectionRange(0, this.currentLatexInputRef.current.value.length);
      this.setState({
        focusWasPerformed: true
      });
    }
  }

  renderNode(node) {
    const proofSummary = node.lineDoubled && node.lineType === 'none';

    return (
      <div
        className='node-wrapper'
        key={node.id}
      >
        {!proofSummary &&
          <div className={`label`}>
            {this.renderLatexInput(node, node.labelInput, true)}
          </div>}
        <div className='node'>
          <div className={`assumptions ${node.assumptions.length === 0 ? '' : 'not-empty-assumptions'}`}>
            {node.assumptions.map((ass, index) => this.renderNode(ass, index))}
            <button
              onClick={this.updateNodeStateOnEvent(true, node.id, (newNodeVer) => {
                let newAssumption = this.createBlankNode(newNodeVer.id);
                newNodeVer.assumptions = node.assumptions.concat([newAssumption]);
              })}
            >
              +
            </button>
            {node.parentId ? <button
              onClick={this.updateNodeStateOnEvent(true, node.parentId, (newParentVer) => {
                newParentVer.assumptions = newParentVer.assumptions.filter((ass) => {
                  return ass.id !== node.id;
                });
              })}
            >
              -
          </button> : null}
          </div >
          {proofSummary ? (
            <div className='proof-summary'>
              <div
                className={`inference-line line-type-${node.lineType} ${node.lineDoubled ? 'line-doubled' : ''}`}
                onClick={this.updateNodeStateOnEvent(true, node.id, (newNodeVer) => {
                  const LINE_TYPES = ['none', 'straight', 'dotted', 'dashed'];
                  newNodeVer.lineType = LINE_TYPES[(LINE_TYPES.indexOf(newNodeVer.lineType) + 1) % LINE_TYPES.length];
                  if (newNodeVer.lineType === 'none') {
                    newNodeVer.lineDoubled = !newNodeVer.lineDoubled;
                  }
                })}
              />
              <div className={`proof-summary-rule-name rule-name`}>
                {this.renderLatexInput(node, node.ruleNameInput, true)}
              </div>
            </div>
          ) : (
              <div
                className={`inference-line line-type-${node.lineType} ${node.lineDoubled ? 'line-doubled' : ''}`}
                onClick={this.updateNodeStateOnEvent(true, node.id, (newNodeVer) => {
                  const LINE_TYPES = ['none', 'straight', 'dotted', 'dashed'];
                  newNodeVer.lineType = LINE_TYPES[(LINE_TYPES.indexOf(newNodeVer.lineType) + 1) % LINE_TYPES.length];
                  if (newNodeVer.lineType === 'none') {
                    newNodeVer.lineDoubled = !newNodeVer.lineDoubled;
                  }
                })}
              />
            )}
          <div
            className='conclusion'
          >
            {this.renderLatexInput(node, node.conclusionInput, false)}
          </div>
        </div>
        {
          !proofSummary &&
          <div className={`rule-name`}>
            {this.renderLatexInput(node, node.ruleNameInput, true)}
          </div>
        }
      </div >
    );
  }

  generateNodeSource(node, tablevel, tab) {
    const proofSummary = node.lineDoubled && node.lineType === 'none';

    let nodeSource = tab.repeat(tablevel) + (proofSummary ? `\\prfsummary` : `\\prftree`);

    if (proofSummary) {
      if (node.ruleNameInput.value !== '') {
        nodeSource += `[${node.ruleNameInput.value}]`;
      }
    } else {
      if (node.lineDoubled) {
        nodeSource += '[double]';
      }

      switch (node.lineType) {
        case 'none': {
          nodeSource += '[noline]';
          break;
        }
        case 'straight': break;
        default: {
          nodeSource += `[${node.lineType}]`;
          break;
        }
      }

      if (node.labelInput.value !== '') {
        nodeSource += `[l]{${node.labelInput.value}}`;
      }

      if (node.ruleNameInput.value !== '') {
        nodeSource += `[r]{${node.ruleNameInput.value}}`;
      }
    }

    nodeSource += '\n';

    if (node.assumptions.length === 0) {

      // add conclusion
      nodeSource += tab.repeat(tablevel);
      nodeSource += `{ ${node.conclusionInput.value} }\n`;

    } else {

      // add assumptions
      node.assumptions.map((assumptionNode) => {
        nodeSource += tab.repeat(tablevel);
        nodeSource += '{\n';

        nodeSource += `${this.generateNodeSource(assumptionNode, tablevel + 1, tab)}`;

        nodeSource += tab.repeat(tablevel);
        nodeSource += '}\n';
      });

      // add conclusion
      nodeSource += tab.repeat(tablevel);
      nodeSource += `{ ${node.conclusionInput.value} }\n`;
    }

    return nodeSource;
  }

  render() {
    const rootNode = this.state.history[this.state.currentVersion];
    const focusedInput = this.findLatexInputRec(rootNode, li => {
      return li.id === this.state.focusedInputId;
    });
    const errorMsg = focusedInput ? focusedInput.errorMsg : '';

    console.log(`errorMsg ${errorMsg} focusedInput ${focusedInput}`);

    if (rootNode === undefined) debugger;

    return (
      <Split
        className="live-editor"
        sizes={[50, 50]}
        minSize={100}
        expandToMin={false}
        gutterSize={10}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={1}
        direction="horizontal"
        cursor="col-resize"
      >
        <InputPane
          rootNode={this.renderNode(rootNode, [])}
          errorMsg={errorMsg}
          onViewClick={() => {
            this.setState({
              focusedInputId: null
            });
          }}
          onUndo={(this.state.currentVersion > 0) && (() => {
            this.setState((state) => ({
              currentVersion: state.currentVersion - 1
            }));
          })}
          onRedo={(this.state.currentVersion < (this.state.history.length - 1)) && (() => {
            this.setState((state) => ({
              currentVersion: state.currentVersion + 1
            }));
          })}
        />
        <OutputPane outputSource={this.generateNodeSource(rootNode, 0, '    ')} />
      </Split>
    )
  }
}

ReactDOM.render(<LiveEditor />,
  document.getElementById('root'));
