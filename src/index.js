import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Split from 'react-split';
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
        label: '',
        ruleName: '',
        conclusion: ''
      },
    };
  }

  renderNode(node) {
    const label = (
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

    const ruleName = (
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

    const conclusion = (
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
        <div className='label'>
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
          >
            {conclusion}
          </div>
        </div>
        <div className='rule-name'>
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

/*
function Square(props) {
  return (
    <button
      className="square"
      onClick={props.onClick}
    >
      {props.value}
    </button>
  );
}

Square.propTypes = {
  onClick: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired
}

class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      squares: Array(9).fill(null),
      xIsNext: true,
    };
  }

  renderSquare(i) {
    return (
      <Square
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  render() {
    return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

Board.propTypes = {
  squares: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [{
        squares: Array(9).fill(null),
      }],
      stepNumber: 0,
      xIsNext: true
    };
  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[this.state.stepNumber];
    const squares = current.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([{
        squares: squares
      }]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext
    });
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    });
  }

  render() {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const winner = calculateWinner(current.squares);
    
    const moves = history.map((step, move) => {
      const desc = move ?
        'Go to move #' + move :
        'Go to game start';
      return (
        <li key={move}>
          <button onClick={() => this.jumpTo(move)}>{desc}</button>
        </li>
      );
    });

    let status;
    if (winner) {
      status = 'Winner: ' + winner;
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={current.squares}
            onClick={(i) => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
        </div>
      </div>
    );
  }
}

// ========================================


function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
*/

ReactDOM.render(<LiveEditor />,
  document.getElementById('root'));
