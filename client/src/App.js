import React, { Component } from 'react';
import './App.css';
import { Card, CardHeader, CardBody, CardFooter, Media } from 'reactstrap'
import Dropzone from 'react-dropzone-uploader'
import 'react-dropzone-uploader/dist/styles.css'


// this function coverts our array buffer of manipulated image to base64 to be used in the image component
// thank you very much, stackoverflow.. saved me hours 🤗
function UInt8ArrayToBase64(buffer) {
  let bin = ''
  for (let i = 0; i < buffer.length; i++) {
    bin += String.fromCharCode(buffer[i])
  }
  return window.btoa(bin)
}


class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      message: '',
      mod: null,
      inst: null,
      memoryByte: null,
      bytes: null,
      manimage: '',
      isProcessing: false
    }

    this.handleChangeStatus = this.handleChangeStatus.bind(this)
  }

  async componentDidMount() {
    let { instance, module } = await WebAssembly.instantiateStreaming(fetch("main.wasm"), window.go.importObject)
    let memByte = new Uint8Array(instance.exports.mem.buffer)
    // saving to state.. tsk tsk not sure its the most optimal but i guess it works?? also, the value isnt that "big" anyway
    this.setState({
      mod: module,
      inst: instance,
      memoryByte: memByte
    })

    window.memoryBuff = memByte
    await window.go.run(instance)
  }

  handleChange = (e) => {
    e.preventDefault();
    this.setState({
      message: e.target.value
    })
  }

  handleSubmit = async (e) => {
    e.preventDefault()
    window.sayHelloJS(this.state.message)
  }


  handleUploadTextChange(files, extras) {
    if (extras.reject) {
      return `Images only`
    }
    return 'Upload an image'
  }


  async handleChangeStatus({ meta, file }, status) {

    this.setState({
      isProcessing: true
    })
    if (status === 'done') {
      let fileBlobURL = meta.previewUrl
      let fetchBlobURL = await fetch(fileBlobURL)
      let fileBlob = await fetchBlobURL.blob()
      let fileReader = new FileReader()
      fileReader.readAsArrayBuffer(fileBlob)
      fileReader.onload = event => {
        let memBuf = new Uint8Array(event.target.result)
        window.imageBuff = memBuf
        let WasmManipulatedImage = window.loadImg(memBuf.length, memBuf)
        let image64 = UInt8ArrayToBase64(WasmManipulatedImage)
        this.setState({ manimage: image64, bytes: event.target.result.byteLength, isProcessing: false })
      }
    }
  }


  render() {
    return (
      <div className="App">
        <form>
          <input type="text" name="" id="userInput" onChange={(e) => this.handleChange(e)} style={{ marginTop: '100px' }} />
          <br />
          <button type="submit" onClick={(e) => this.handleSubmit(e)}>Click me to see MAGIC!!</button>
        </form>
        <br />
        <span id="message">
          Ayomide Onigbinde wrote this!!😉...💕 from WebAssembly and Golang
        </span>

        <Card className='d-flex justify-content-center' style={{ marginTop: '10vh', marginLeft: '20%', marginRight: '20%', height: 350 }}>
          <CardHeader style={{ color: 'black' }}>
            Click Below to Upload an image to manipulate
          </CardHeader>

          <CardBody>
            <Dropzone
              onChangeStatus={this.handleChangeStatus}
              onSubmit={this.handleImageSubmit}
              accept='image/*'
              styles={{ previewImage: { maxHeight: '70px', maxWidth: '70px' }, dropzone: { height: 200 }, inputLabel: (files, extra) => extra.reject ? {} : {}, inputLabelWithFiles: (files, extra) => { } }}
              inputContent={this.handleUploadTextChange}
              maxFiles={1}

            />
          </CardBody>

          <CardFooter>

          </CardFooter>
        </Card>
        <Card>
          {this.state.isProcessing ? <span>Processing your image...</span> : (!this.state.manimage ? <span>Please Upload an Image. Manipulated image appears here</span> :
            <Media src={`data:image/png;base64,${this.state.manimage}`} alt="" style={{ height: '50%', width: '50%' }}></Media>)}
        </Card>
      </div>
    )
  }
}

export default App;
