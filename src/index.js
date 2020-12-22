/* eslint-disable react/prop-types */
import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'

const accurateInterval = function (fn, time) {
  let cancel, nextAt, timeout, wrapper
  nextAt = new Date().getTime() + time
  timeout = null
  // eslint-disable-next-line prefer-const
  wrapper = function () {
    nextAt += time
    timeout = setTimeout(wrapper, nextAt - new Date().getTime())
    return fn()
  }
  // eslint-disable-next-line prefer-const
  cancel = function () {
    return clearTimeout(timeout)
  }
  timeout = setTimeout(wrapper, nextAt - new Date().getTime())
  return {
    cancel: cancel
  }
}

// COMPONENTS:
class TimerLengthControl extends React.Component {
  render () {
    return (
      <div className="length-control">
        <div id={this.props.titleID}>{this.props.title}</div>
        <button
          className="btn-level"
          id={this.props.minID}
          onClick={this.props.onClick}
          value="-"
        >-</button>
        <p className="btn-level" id={this.props.lengthID}>
          {this.props.length}
        </p>
        <button
          className="btn-level"
          id={this.props.addID}
          onClick={this.props.onClick}
          value="+"
        >+</button>
      </div>
    )
  }
}

class Timer extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      brkLength: 5,
      seshLength: 25,
      timerState: 'stopped',
      timerType: 'Session',
      timer: 1500,
      intervalID: ''
    }
    this.setBrkLength = this.setBrkLength.bind(this)
    this.setSeshLength = this.setSeshLength.bind(this)
    this.lengthControl = this.lengthControl.bind(this)
    this.timerControl = this.timerControl.bind(this)
    this.beginCountDown = this.beginCountDown.bind(this)
    this.decrementTimer = this.decrementTimer.bind(this)
    this.phaseControl = this.phaseControl.bind(this)
    this.buzzer = this.buzzer.bind(this)
    this.switchTimer = this.switchTimer.bind(this)
    this.clockify = this.clockify.bind(this)
    this.reset = this.reset.bind(this)
  }

  setBrkLength (e) {
    this.lengthControl(
      'brkLength',
      e.currentTarget.value,
      this.state.brkLength,
      'Session'
    )
  }

  setSeshLength (e) {
    this.lengthControl(
      'seshLength',
      e.currentTarget.value,
      this.state.seshLength,
      'Break'
    )
  }

  lengthControl (stateToChange, sign, currentLength, timerType) {
    if (this.state.timerState === 'running') {
      return
    }
    if (this.state.timerType === timerType) {
      if (sign === '-' && currentLength !== 1) {
        this.setState({ [stateToChange]: currentLength - 1 })
      } else if (sign === '+' && currentLength !== 60) {
        this.setState({ [stateToChange]: currentLength + 1 })
      }
    } else if (sign === '-' && currentLength !== 1) {
      this.setState({
        [stateToChange]: currentLength - 1,
        timer: currentLength * 60 - 60
      })
    } else if (sign === '+' && currentLength !== 60) {
      this.setState({
        [stateToChange]: currentLength + 1,
        timer: currentLength * 60 + 60
      })
    }
  }

  timerControl () {
    if (this.state.timerState === 'stopped') {
      this.beginCountDown()
      this.setState({ timerState: 'running' })
    } else {
      this.setState({ timerState: 'stopped' })
      if (this.state.intervalID) {
        this.state.intervalID.cancel()
      }
    }
  }

  beginCountDown () {
    this.setState({
      intervalID: accurateInterval(() => {
        this.decrementTimer()
        this.phaseControl()
      }, 1000)
    })
  }

  decrementTimer () {
    this.setState({ timer: this.state.timer - 1 })
  }

  phaseControl () {
    const timer = this.state.timer
    this.buzzer(timer)
    if (timer < 0) {
      if (this.state.intervalID) {
        this.state.intervalID.cancel()
      }
      if (this.state.timerType === 'Session') {
        this.beginCountDown()
        this.switchTimer(this.state.brkLength * 60, 'Break')
      } else {
        this.beginCountDown()
        this.switchTimer(this.state.seshLength * 60, 'Session')
      }
    }
  }

  buzzer (_timer) {
    if (_timer === 0) {
      this.audioBeep.play()
    }
  }

  switchTimer (num, str) {
    this.setState({
      timer: num,
      timerType: str
    })
  }

  clockify () {
    let minutes = Math.floor(this.state.timer / 60)
    let seconds = this.state.timer - minutes * 60
    seconds = seconds < 10 ? '0' + seconds : seconds
    minutes = minutes < 10 ? '0' + minutes : minutes
    return minutes + ':' + seconds
  }

  reset () {
    this.setState({
      brkLength: 5,
      seshLength: 25,
      timerState: 'stopped',
      timerType: 'Session',
      timer: 1500,
      intervalID: ''
    })
    if (this.state.intervalID) {
      this.state.intervalID.cancel()
    }
    this.audioBeep.pause()
    this.audioBeep.currentTime = 0
  }

  render () {
    return (
      <div>
        <div className="main-title">25 + 5 Clock</div>
        <TimerLengthControl
          addID="break-increment"
          length={this.state.brkLength}
          lengthID="break-length"
          minID="break-decrement"
          onClick={this.setBrkLength}
          title="Break Length"
          titleID="break-label"
        />
        <TimerLengthControl
          addID="session-increment"
          length={this.state.seshLength}
          lengthID="session-length"
          minID="session-decrement"
          onClick={this.setSeshLength}
          title="Session Length"
          titleID="session-label"
        />
        <div className="timer">
          <div className="timer-wrapper">
            <div id="timer-label">{this.state.timerType}</div>
            <div id="time-left">{this.clockify()}</div>
          </div>
        </div>
        <div className="timer-control">
          <button id="start_stop" onClick={this.timerControl}>
            Start / Stop
          </button>
          <button id="reset" onClick={this.reset}>
            Reset
          </button>
        </div>
        <audio
          id="beep"
          preload="auto"
          ref={(audio) => {
            this.audioBeep = audio
          }}
          src="https://raw.githubusercontent.com/freeCodeCamp/cdn/master/build/testable-projects-fcc/audio/BeepSound.wav"
        />
      </div>
    )
  }
}

ReactDOM.render(<Timer />, document.getElementById('root'))
