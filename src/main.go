package main

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"syscall/js"
)

var c chan bool
var inputSourceImg image.Image

func init() {
	fmt.Println("Hello, WebAssembly! This is to tell us everything works!")
	c = make(chan bool)
}

func main() {
	js.Global().Set("sayHelloJS", js.FuncOf(SayHello))
	js.Global().Set("loadImg", js.FuncOf(LoadAndProcessImage))
	// TODO: prevent exiting the channel even if there was an error and the app crashes.
	println("Done.. done.. done...")
	<-c
}

// SayHello simply set the textConent of our element based on the value it receives (i.e the value from the input box)
// the element MUST exist else it'll throw an exception
func SayHello(jsV js.Value, inputs []js.Value) interface{} {
	message := inputs[0].String()
	h := js.Global().Get("document").Call("getElementById", "message")
	h.Set("textContent", message)
	return nil
}

// LoadAndProcessImage loads the image and processes it, then return the manipulated image as an array buffer.
func LoadAndProcessImage(v js.Value, inputs []js.Value) interface{} {
	bufferSize := inputs[0].Int()
	buffer := inputs[1]
	bufferDestn := make([]byte, bufferSize)
	_ = js.CopyBytesToGo(bufferDestn, buffer)

	// register the format we're expecting
	image.RegisterFormat("png", "png", png.Decode, png.DecodeConfig)

	decodedImage, format, err := image.Decode(bytes.NewReader(bufferDestn))
	js.Global().Get("console").Call("log", "THE FORMAT IS", format)
	handleError(err)
	inputSourceImg = decodedImage
	img := decolorizeHalf(decodedImage)

	buf := new(bytes.Buffer)
	err = png.Encode(buf, img)
	handleError(err)

	// create a JS Uint8array destination Array. This is where we'll copy the bytes to which we're then returning. Its the array buffer of the manipulated image
	uintdestination := js.Global().Get("Uint8Array").New(bufferSize)
	_ = js.CopyBytesToJS(uintdestination, buf.Bytes())

	// return the manipulate image Uint8Array
	return uintdestination
}

// decolorizeHalf decolorizes half of the image, starting from the left until the middle, leaving the remaining to retain its original color
func decolorizeHalf(img image.Image) image.Image {
	// TODO: this could be optimized.. like using bit shifting to reduce length of the code.
	size := img.Bounds().Size()
	rect := image.Rect(0, 0, size.X, size.Y)
	wImg := image.NewRGBA(rect)

	// looping through all the pixels in the image
	for x := 0; x < size.X; x++ {
		for y := 0; y < size.Y; y++ {
			pixel := img.At(x, y)
			originalColor := color.RGBAModel.Convert(pixel).(color.RGBA)

			r := float64(originalColor.R) * 0.92126
			g := float64(originalColor.G) * 0.97152
			b := float64(originalColor.B) * 0.90722

			grey := uint8((r + g + b) / 3)

			c := color.RGBA{
				R: grey, G: grey, B: grey, A: originalColor.A,
			}

			// we're at the middle of the x-y axis. then we want make the middle to the end (right) of the pix retain its original color
			if x >= size.X/2 {
				pixel = img.At(x, y)
				originalColor = color.RGBAModel.Convert(pixel).(color.RGBA)
				c = color.RGBA{R: originalColor.R, G: originalColor.G, B: originalColor.B, A: originalColor.A}
				wImg.Set(x, y, c)
			}
			wImg.Set(x, y, c)
		}
	}

	return wImg
}

// sepiaEffect implements the algorithm that applies sepia effect to an image.
func sepiaEffect(img image.Image) image.Image {
	size := img.Bounds().Size()
	rect := image.Rect(0, 0, size.X, size.Y)
	wImg := image.NewRGBA(rect)

	for x := 0; x < size.X; x++ {
		for y := 0; y < size.Y; y++ {
			pixel := img.At(x, y)
			originalColor := color.RGBAModel.Convert(pixel).(color.RGBA)
			col := color.RGBA{R: originalColor.R, G: originalColor.G, B: originalColor.B, A: originalColor.A}

			tr := 0.393*float64(col.R) + 0.769*float64(col.G) + 0.189*float64(col.B)
			tg := 0.349*float64(col.R) + 0.686*float64(col.G) + 0.168*float64(col.B)
			tb := 0.272*float64(col.R) + 0.53*float64(col.G) + 0.131*float64(col.B)

			if tr > 255 {
				col.R = 255
			} else {
				col.R = uint8(tr)
			}

			if tg > 255 {
				col.G = 255
			} else {
				col.G = uint8(tg)
			}

			if tb > 255 {
				col.B = 255
			} else {
				col.B = uint8(tb)
			}
			wImg.Set(x, y, col)
		}
	}

	return wImg
}

// monochrome creates a black and white effect on the image
func monochrome(img image.Image) image.Image {
	size := img.Bounds().Size()
	rect := image.Rect(0, 0, size.X, size.Y)
	wImg := image.NewRGBA(rect)

	// looping through all the pixels in the image
	for x := 0; x < size.X; x++ {
		for y := 0; y < size.Y; y++ {
			pixel := img.At(x, y)
			originalColor := color.RGBAModel.Convert(pixel).(color.RGBA)

			r := float64(originalColor.R) * 0.92126
			g := float64(originalColor.G) * 0.97152
			b := float64(originalColor.B) * 0.90722

			grey := uint8((r + g + b) / 3)

			c := color.RGBA{
				R: grey, G: grey, B: grey, A: originalColor.A,
			}

			wImg.Set(x, y, c)
		}
	}

	return wImg
}

func handleError(err error) {
	if err != nil {
		panic(err)
	}
}
