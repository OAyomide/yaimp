import React, { Component } from 'react'

class Footer extends Component {
    render() {
        return (
            <div>
                <footer className="footer">
                    Made with ❤️ &#9400; {`${new Date().getFullYear()}`}. &nbsp; Ayomide Onigbinde
                </footer>
            </div>
        )
    }
}

export default Footer