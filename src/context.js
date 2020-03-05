class Token {
  constructor(rawToken = 'fakeToken') {
    console.log('Faking token')
    this.token = rawToken
    this.client = 'Fake Client'
    this.user = { username: 'fakeUser' }
  }
    
  validate() {
    // implement desired authentication mechanism here like jwt
    console.log('faking token validation')
    return true
  }

}

const context = async ({ req }) => {
  const token = new Token(req.header('authorization'))
  await token.validate()
  return { client: token.client, user: token.user }
}

module.exports = context