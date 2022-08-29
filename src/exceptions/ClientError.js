class ClientError extends Error {
  constructor(message, statusCode = 400) { // nilai kode error default
    super(message);
    this.statusCode = statusCode;
    this.name = 'ClientError';
  }
}

module.exports = ClientError;
