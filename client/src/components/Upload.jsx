import React, { Component } from "react";
import { Card, CardHeader, CardBody, CardFooter, Row, Col, Container } from "reactstrap";
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
    this.state = {
      manipulatedImage: ''
    }
  }

  // handleChangeStatus method handles the conversion of our image to UInt8Array which we pass to the WebAssembly exported function that applies the effect we want
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
        this.setState({ manipulatedImage: image64, bytes: event.target.result.byteLength, isProcessing: false })
      }
    }
  }


  render() {
    return (
      <div className="images-container">
        <Container fluid={true}>
          <Row>
            <Col md={6} sm={12}>
              <Card>
                <CardHeader>
                  <span>Please Upload your image here</span>
                </CardHeader>
              </Card>
              <CardBody>
                <Dropzone
                  onChangeStatus={this.handleChangeStatus}
                  onSubmit={this.handleImageSubmit}
                  accept='image/png'
                  styles={{ previewImage: { maxHeight: '70px', maxWidth: '70px' }, dropzone: { height: 200 }, inputLabel: (files, extra) => extra.reject ? {} : {}, inputLabelWithFiles: (files, extra) => { } }}
                  inputContent={this.handleUploadTextChange}
                  maxFiles={1}
                />
              </CardBody>
            </Col>

            <Col>
              <Card>
                <CardHeader>
                  <span>Output of your effect</span>
                </CardHeader>
              </Card>
              <CardBody>

              </CardBody>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}

export default UploadImageComponent