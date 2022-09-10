/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const importQueue = importScript("https://scotwatson.github.io/Queue/Queue.mjs");

importQueue.catch(function (err) {
  throw err;
});

importQueue.then(function (Queue) {
  class AudioOutputProcessor extends AudioWorkletProcessor {
    #queue;
    constructor() {
      this.#queue = new Queue.Float32Queue();
      this.port.addEventListener("message", function (evt) {
        const queueData = this.#queue.reserve(evt.data.length);
        queueData.set(evt.data);
        this.#queue.enqueue();
      });
    }
    process(inputs, outputs, parameters) {
      const queueData = this.#queue.dequeue(outputs[0][0].length);
      outputs[0][0].set(queueData);
      return true;
    }
  };
  registerProcessor('audio-output-processor', AudioOutputProcessor);
});
