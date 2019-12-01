import React, { Component } from 'react'
import Header from '../components/Header/Header'
import { Card, CardHeader } from 'reactstrap'

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
      </div>
    )
  }
}

export default HomeComponent