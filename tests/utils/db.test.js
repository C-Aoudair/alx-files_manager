import { expect } from 'chai';
import sinon from 'sinon';
import { MongoClient } from 'mongodb';
import DBClient from '../../utils/db';


const mockConnect = sinon.stub();
const mockMongoClient = {
  connect: mockConnect,
};
sinon.stub(MongoClient, 'constructor').returns(mockMongoClient);

describe('DBClient', () => {
  let dbClient;

  beforeEach(() => {
    sinon.restore();
    dbClient = new DBClient();
  });

  it('should create a singleton instance', () => {
    const dbClient2 = new DBClient();
    expect(dbClient).to.equal(dbClient2);
  });

  it('should initialize with default values', () => {
    expect(dbClient.host).to.equal('localhost');
    expect(dbClient.port).to.equal(27017);
    expect(dbClient.database).to.equal('files_manager');
  });

  it('should call connect method on instantiation', () => {
    expect(MongoClient.constructor).to.have.been.calledWith('mongodb://localhost:27017', {
      useUnifiedTopology: true,
    });
    expect(mockConnect).to.have.been.called;
  });

  it('connect method should handle connection', async () => {
    mockConnect.resolves(true);
    await dbClient.connect();
    expect(mockConnect).to.have.been.called;
  });

  it('connect method should handle connection errors', async () => {
    mockConnect.rejects(new Error('Connection failed'));
    await expect(dbClient.connect()).to.be.rejectedWith('Connection failed');
  });
});