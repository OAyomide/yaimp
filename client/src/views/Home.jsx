import React, { Component } from 'react'
import Header from '../components/Header/Header'
import { Card, CardHeader } from 'reactstrap'
import Footer from '../components/Footer/Footer'

class HomeComponent extends Component {
  render() {
    return (
      <div>
        <Header />
        <div>
          <Card>
            <CardHeader>
              <span>Hello there!!</span>
            </CardHeader>
          </Card>
        </div>
        <div>
          <Footer />
        </div>
      </div>
    )
  }
}

export default HomeComponent