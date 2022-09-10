/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Queue from "https://scotwatson.github.io/Queue/Queue.mjs";

const audioContext = new self.AudioContext();
await audioContext.audioWorklet.addModule("audio-input-processor.js");
await audioContext.audioWorklet.addModule("audio-output-processor.js");
audioContext.createAudioInput = function () {
  return new AudioWorkletNode(audioContext, "audio-input-processor");
};
audioContext.createAudioOutput = function () {
  return new AudioWorkletNode(audioContext, "audio-output-processor");
};

export class PushSourceMicrophone extends EventTarget {
  #inputNode;
  constructor() {
    this.#inputNode = null;
  }
  async start(constraints) {
    const that = this;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const sourceNode = audioContext.createMediaStreamAudioSource({
        mediaStream,
      });
      this.#inputNode = audioContext.createAudioInput();
      sourceNode.connect(this.#inputNode);
      this.#inputNode.port.addEventListener("message", function (evt) {
        that.dispatchEvent("push", evt.data);
      });
    } catch (err) {
      throw new Error("Unable to start");
    }
  }
  async stop() {
    this.#inputNode = null;
  }
};

export class PushSinkSpeaker extends EventTarget {
  #outputNode;
  constructor(args) {
    const that = this;
    this.#outputNode = audioContext.createAudioOutput();
    this.#outputNode.connect(audioContext.destination);
    this.#outputNode.port.addEventListener("message", function (evt) {
      that.dispatchEvent(evt.data);
    });
  }
  enqueue(args) {
    this.#outputNode.port.postMessage(args.input, [ args.input.buffer ]);
  }
};

export class LowPassWhiteNoise extends EventTarget {
  #samplesPerIteration;
  #bufferQueue;
  #x1 = 0;
  #x2 = 0;
  #y1 = 0;
  #y2 = 0;
  constructor(args) {
    function sendSamples() {
      for (let i = 0; i < this.#samplesPerIteration; ++i) {
        const x0 = (2 * Math.random()) - 1;
        const y0 = 1.08 * x0 + 1.65 * this.#x1 + 0.86 * this.#x2 - 1.70 * this.#y1 - 0.72 * this.#y2;
        this.#bufferQueue.addElement(y0);
        this.#x2 = this.#x1;
        this.#x1 = x0;
        this.#y2 = this.#y1;
        this.#y1 = y0;
      }
    }
    self.setInterval(sendSamples, 100);
  }
  new Event();
  this.dispatchEvent();
};
