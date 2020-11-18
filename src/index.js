import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Split from 'react-split';
import { MathComponent } from 'mathjax-react';
import { v4 as uuidv4 } from 'uuid';
import './index.css';

class InputPane extends React.Component {
  render() {
    return (
      <div className="input-pane pane">
        <div className="tree-wrapper">
          {this.props.rootNode}
        </div>
      </div>
    )
  }
}

InputPane.propTypes = {
  rootNode: PropTypes.object.isRequired,
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
    this.state = {
      rootNode: {
        parent: null,
        id: uuidv4(),
        assumptions: [],
        conclusionFocused: false,
        labelFocused: false,
        ruleNameFocused: false,
        label: '',
        ruleName: '',
        conclusion: ''
      },
    };
  }

  renderNode(node) {
    const label = (!node.labelFocused) ? (
      <MathComponent
        display={false}
        tex={`\\small{\\text{${node.label.length === 0 ? '.' : node.label}}}`}
      />
    ) : (
        <input
          type='text'
          placeholder='.'
          defaultValue={node.label}
          style={{ width: `${Math.max(1, node.label.length)}ch` }}
          onInput={(event) => {
            let rootNodeCopy = { ...this.state.rootNode };

            if (node.id === this.state.rootNode.id) {
              rootNodeCopy.label = event.target.value;
            } else {
              node.label = event.target.value;
            }

            this.setState({
              rootNode: rootNodeCopy
            });
          }}
        />
      );

    const ruleName = (!node.ruleNameFocused) ? (
      <MathComponent
        display={false}
        tex={`\\small{\\text{${node.ruleName.length === 0 ? '.' : node.ruleName}}}`}
      />
    ) : (
        <input
          type='text'
          placeholder='.'
          defaultValue={node.ruleName}
          style={{ width: `${Math.max(1, node.ruleName.length)}ch` }}
          onInput={(event) => {
            let rootNodeCopy = { ...this.state.rootNode };

            if (node.id === this.state.rootNode.id) {
              rootNodeCopy.ruleName = event.target.value;
            } else {
              node.ruleName = event.target.value;
            }

            this.setState({
              rootNode: rootNodeCopy
            });
          }}
        />
      );

    const conclusion = (!node.conclusionFocused) ? (
      <MathComponent
        display={false}
        tex={node.conclusion.length === 0 ? '...' : node.conclusion}
      />
    ) : (
        <input
          type='text'
          placeholder='...'
          defaultValue={node.conclusion}
          style={{ width: `${Math.max(3, node.conclusion.length)}ch` }}
          onInput={(event) => {
            let rootNodeCopy = { ...this.state.rootNode };

            if (node.id === this.state.rootNode.id) {
              rootNodeCopy.conclusion = event.target.value;
            } else {
              node.conclusion = event.target.value;
            }

            this.setState({
              rootNode: rootNodeCopy
            });
          }}
        />
      );

    return (
      <div
        className='node-wrapper'
        key={node.id}
      >
        <div
          className='label'
          onBlur={() => {
            let rootNodeCopy = { ...this.state.rootNode };

            if (node.id === this.state.rootNode.id) {
              rootNodeCopy.labelFocused = false;
            } else {
              node.labelFocused = false;
            }

            this.setState({
              rootNode: rootNodeCopy
            });
          }}
          onClick={() => {
            let rootNodeCopy = { ...this.state.rootNode };

            if (node.id === this.state.rootNode.id) {
              rootNodeCopy.labelFocused = true;
            } else {
              node.labelFocused = true;
            }

            this.setState({
              rootNode: rootNodeCopy
            });
          }}
        >
          {label}
        </div>
        <div className='node'>
          <div className='assumptions'>
            {node.assumptions.map((ass, index) => this.renderNode(ass, index))}
            <button
              onClick={() => {
                let rootNodeCopy = { ...this.state.rootNode };

                const newAssumption = {
                  parent: node,
                  id: uuidv4(),
                  conclusionFocused: false,
                  labelFocused: false,
                  ruleNameFocused: false,
                  assumptions: [],
                  label: '',
                  ruleName: '',
                  conclusion: ''
                };

                if (node.id === this.state.rootNode.id) {
                  rootNodeCopy.assumptions = rootNodeCopy.assumptions.concat([newAssumption]);
                } else {
                  node.assumptions = node.assumptions.concat([newAssumption]);
                }

                this.setState({
                  rootNode: rootNodeCopy
                });
              }}
            >
              +
          </button>
            {node.parent ? <button
              onClick={() => {
                let rootNodeCopy = { ...this.state.rootNode };

                if (node.parent.id === this.state.rootNode.id) {
                  rootNodeCopy.assumptions = rootNodeCopy.assumptions.filter((ass) => {
                    return ass.id !== node.id;
                  });
                } else {
                  node.parent.assumptions = node.parent.assumptions.filter((ass) => {
                    return ass.id !== node.id;
                  });
                }

                this.setState({
                  rootNode: rootNodeCopy
                });
              }}
            >
              -
          </button> : null}
          </div >
          <div className='inference-line'>

          </div>
          <div
            className='conclusion'
            onBlur={() => {
              let rootNodeCopy = { ...this.state.rootNode };

              if (node.id === this.state.rootNode.id) {
                rootNodeCopy.conclusionFocused = false;
              } else {
                node.conclusionFocused = false;
              }

              this.setState({
                rootNode: rootNodeCopy
              });
            }}
            onClick={() => {
              let rootNodeCopy = { ...this.state.rootNode };

              if (node.id === this.state.rootNode.id) {
                rootNodeCopy.conclusionFocused = true;
              } else {
                node.conclusionFocused = true;
              }

              this.setState({
                rootNode: rootNodeCopy
              });
            }}
          >
            {conclusion}
          </div>
        </div>
        <div
          className='rule-name'
          onBlur={() => {
            let rootNodeCopy = { ...this.state.rootNode };

            if (node.id === this.state.rootNode.id) {
              rootNodeCopy.ruleNameFocused = false;
            } else {
              node.ruleNameFocused = false;
            }

            this.setState({
              rootNode: rootNodeCopy
            });
          }}
          onClick={() => {
            let rootNodeCopy = { ...this.state.rootNode };

            if (node.id === this.state.rootNode.id) {
              rootNodeCopy.ruleNameFocused = true;
            } else {
              node.ruleNameFocused = true;
            }

            this.setState({
              rootNode: rootNodeCopy
            });
          }}
        >
          {ruleName}
        </div>
      </div >
    );
  }

  generateNodeSource(node, tablevel, tab) {
    let nodeSource = tab.repeat(tablevel) + `\\prftree`;

    if (node.label !== '') {
      nodeSource += `[l]{${node.label}}`;
    }

    if (node.ruleName !== '') {
      nodeSource += `[r]{${node.ruleName}}`;
    }

    nodeSource += '\n';

    if (node.assumptions.length === 0) {

      // add conclusion
      nodeSource += tab.repeat(tablevel);
      nodeSource += `{ ${node.conclusion} }\n`;

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
      nodeSource += `{ ${node.conclusion} }\n`;
    }

    return nodeSource;
  }

  render() {
    const rootNode = this.state.rootNode;

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
        <InputPane rootNode={this.renderNode(rootNode, [])} />
        <OutputPane outputSource={this.generateNodeSource(rootNode, 0, '    ')} />
      </Split>
    )
  }
}

ReactDOM.render(<LiveEditor />,
  document.getElementById('root'));
