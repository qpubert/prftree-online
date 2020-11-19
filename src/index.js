import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Split from 'react-split';
import { MathComponent } from 'mathjax-react';
import { v4 as uuidv4 } from 'uuid';
import './index.css';

class InputPane extends React.Component {
  render() {
    const inputPane = (
      <div
        className="input-pane pane"
        onClick={this.props.onViewClick}
      >
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
      rootNode: this.createBlankNode(),
      focusedInput: null,
      focusWasPerformed: false,
    };
  }

  createBlankNode(parent = null) {
    return {
      parent: parent,
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

  updateNodeStateOnEvent(node, func) {
    return (event) => {
      let rootNodeCopy = { ...this.state.rootNode };

      if (node.id === this.state.rootNode.id) {
        func(rootNodeCopy, event);
      } else {
        func(node, event);
      }

      this.setState({
        rootNode: rootNodeCopy
      });
    };
  }

  renderLatexInput(node, latexInput, smallTextModeEnabled = true) {
    const dots = smallTextModeEnabled ? '?' : '?';
    const focused = this.state.focusedInput && latexInput.id == this.state.focusedInput.id;
    const latexHidden = focused || latexInput.errorMsg !== '';

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
              focusedInput: latexInput,
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
            onError={this.updateNodeStateOnEvent(node, (_, errorMsg) => {
              latexInput.errorMsg = errorMsg;
            })}
            onSuccess={this.updateNodeStateOnEvent(node, (_, errorMsg) => {
              latexInput.errorMsg = '';
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
            onInput={this.updateNodeStateOnEvent(node, (_, event) => {
              latexInput.value = event.target.value;
            })}
            ref={focused ? this.currentLatexInputRef : null}
            onFocus={() => {
              this.setState({
                focusedInput: latexInput,
              });
            }}
          />
        </div>}
      </div>
    );
  }

  componentDidUpdate() {
    console.log("component did update");
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
              onClick={this.updateNodeStateOnEvent(node, (node) => {
                let newAssumption = this.createBlankNode(node);
                node.assumptions = node.assumptions.concat([newAssumption]);
              })}
            >
              +
          </button>
            {node.parent ? <button
              onClick={this.updateNodeStateOnEvent(node.parent, (parent) => {
                parent.assumptions = parent.assumptions.filter((ass) => {
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
                onClick={this.updateNodeStateOnEvent(node, (node) => {
                  const LINE_TYPES = ['none', 'straight', 'dotted', 'dashed'];
                  node.lineType = LINE_TYPES[(LINE_TYPES.indexOf(node.lineType) + 1) % LINE_TYPES.length];
                  if (node.lineType === 'none') {
                    node.lineDoubled = !node.lineDoubled;
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
                onClick={this.updateNodeStateOnEvent(node, (node) => {
                  const LINE_TYPES = ['none', 'straight', 'dotted', 'dashed'];
                  node.lineType = LINE_TYPES[(LINE_TYPES.indexOf(node.lineType) + 1) % LINE_TYPES.length];
                  if (node.lineType === 'none') {
                    node.lineDoubled = !node.lineDoubled;
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
    const rootNode = this.state.rootNode;
    const errorMsg = this.state.focusedInput ? this.state.focusedInput.errorMsg : '';

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
            console.log('test');
            this.setState({
              focusedInput: null
            });
          }}
        />
        <OutputPane outputSource={this.generateNodeSource(rootNode, 0, '    ')} />
      </Split>
    )
  }
}

ReactDOM.render(<LiveEditor />,
  document.getElementById('root'));
