import React, { Component } from "react";
import { Card, CardHeader, CardBody, CardFooter, Row, Col, Container, Media, FormGroup, Label, Input, Button } from "reactstrap";
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


class UploadImageComponent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      manipulatedImage: '',
      mod: null,
      inst: null,
      memoryByte: null,
      bytes: null,
      isProcessing: false,
      effect: 'monochrome', // using monochrome as the default effect,
      disabledEffect: true, // 💡 an idea could be to make this reflexive of isProcessing i.e make it depend on the state of isProcessing instead of manually specifying the current state everywhere... dunno, just an idea. current implementationw works just great
      imageMeta: null
    }
    this.handleChangeStatus = this.handleChangeStatus.bind(this)
  }

  async componentDidMount() {
    let { instance, module } = await WebAssembly.instantiateStreaming(fetch("main.wasm"), window.go.importObject)
    let memByte = new Uint8Array(instance.exports.mem.buffer)
    this.setState({
      mod: module,
      inst: instance,
      memoryByte: memByte
    })

    window.memoryBuff = memByte
    await window.go.run(instance)
  }

  // handleChangeStatus method handles the conversion of our image to UInt8Array which we pass to the WebAssembly exported function that applies the effect we want
  async handleChangeStatus({ meta, file }, status) {

    this.setState({
      isProcessing: true
    })
    if (status === 'done') {
      this.setState({ isProcessing: false, disabledEffect: false, imageMeta: meta })
    } else if (status === 'removed') {
      this.setState({ isProcessing: false })
    }
  }

  async handleManipulationTrigger(meta) {
    let fileBlobURL = meta.previewUrl
    let fetchBlobURL = await fetch(fileBlobURL)
    let fileBlob = await fetchBlobURL.blob()
    let fileReader = new FileReader()
    fileReader.readAsArrayBuffer(fileBlob)
    fileReader.onload = event => {
      let memBuf = new Uint8Array(event.target.result)
      window.imageBuff = memBuf
      let WasmManipulatedImage = window.LoadAndProcessImage(memBuf.length, this.state.effect, memBuf)
      let image64 = UInt8ArrayToBase64(WasmManipulatedImage)
      this.setState({ manipulatedImage: image64, bytes: event.target.result.byteLength, isProcessing: false, disabledEffect: false })
    }
  }
  // changes the message text of the Dropzone upload component
  handleUploadTextChange(files, extras) {
    if (extras.reject) {
      return `Images only`
    }
    return 'Upload an image'
  }

  handleChange = (e) => {
    e.preventDefault();
    this.setState({
      message: e.target.value
    })
  }

  handleEffectValueChange = e => {
    let value = e.target.value
    let { imageMeta } = this.state
    this.setState({ effect: value, isProcessing: true, disabledEffect: true }, async () => {
      this.handleManipulationTrigger(imageMeta)
    })
  }

  renderEffectsDropdown() {
    return (
      <div>
        <FormGroup>
          <Label for="select">Effect</Label>
          <Input type="select" name="select" id="effectselect" required onChange={e => this.handleEffectValueChange(e)} defaultValue="" disabled={this.state.disabledEffect}>
            <option value="">Select</option>
            <option value="monochrome">Monochrome</option>
            <option value="half-monochrome">Half Monochrome</option>
            <option value="sepia">Sepia</option>
          </Input>
        </FormGroup>
      </div>
    )
  }

  async handleManipulatedImageDownload(e) {
    e.preventDefault()
    const { manipulatedImage } = this.state
    let blob = await (await fetch(`data:application/octet-stream;base64,${manipulatedImage}`)).blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'yaimpManipulated.png')
    document.body.appendChild(link)
    link.click()
  }


  render() {
    const { manipulatedImage, isProcessing } = this.state
    return (
      <div className="images-container">
        <Container>
          <Row>
            <Col md={6} sm={12} xs={12}>
              <Card>
                <CardHeader>
                  <span>Please Upload your image here</span>
                </CardHeader>
              </Card>
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
              {this.renderEffectsDropdown()}
            </Col>

            <Col>
              <Card>
                <CardHeader>
                  <span>Output of your effect</span>
                </CardHeader>
              </Card>
              <CardBody>
                {isProcessing ? <span>Processing your image...</span> : (!manipulatedImage ? <span>Please Upload an Image. Manipulated image appears here</span> :
                  <Media src={`data:image/png;base64,${manipulatedImage}`} alt="" style={{ height: '100%', width: '100%', position: 'relative' }}></Media>)}
              </CardBody>

              <CardFooter>
                <Button type='submit' color='success' disabled={!manipulatedImage ? true : false} onClick={async e => await this.handleManipulatedImageDownload(e)}>Download</Button>
              </CardFooter>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}

export default UploadImageComponent