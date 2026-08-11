/* eslint-disable import/no-commonjs */
/* eslint-disable import/extensions */
const { assert } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const generator = require('../');

/** @typedef {import('../types').ApiConfiguration} ApiConfiguration */

/**
 * Helper to validate AMF v5 JSON-LD output format
 * @param {any} data
 */
function assertValidAmfModel(data) {
  assert.typeOf(data, 'object', 'data is an object');
  assert.property(data, '@graph', 'has @graph property');
  assert.typeOf(data['@graph'], 'array', '@graph is an array');
  assert.isAbove(data['@graph'].length, 0, '@graph has elements');
}

describe('API generation', () => {
  const dest = path.join('test', 'playground');
  const srcDir = 'test/';

  describe('RAML 1.0 data model generation', () => {
    let files;
    let opts;

    const modelFile = path.join(dest, 'raml1.json');
    const compactModelFile = path.join(dest, 'raml1-compact.json');

    beforeEach(() => {
      files = new Map();
      opts = {
        src: srcDir,
        dest,
      };
    });

    afterEach(() => fs.remove(dest));

    it('Generates data model for regular model', async () => {
      files.set('apis/raml1.raml', 'RAML 1.0');
      await generator(files, opts);
      const exists = await fs.pathExists(modelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(modelFile);
      assertValidAmfModel(data);
    });

    it('Generates data model for compact model', async () => {
      files.set('apis/raml1.raml', 'RAML 1.0');
      await generator(files, opts);
      const exists = await fs.pathExists(compactModelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(compactModelFile);
      assertValidAmfModel(data);
    });

    it('generates model with options (Object)', async () => {
      files.set('apis/raml1.raml', {
        type: 'RAML 1.0',
        mime: 'application/raml',
        resolution: 'editing',
      });
      await generator(files, opts);
      const exists = await fs.pathExists(compactModelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(compactModelFile);
      assertValidAmfModel(data);
    });

    it('uses default values (Object)', async () => {
      files.set('apis/raml1.raml', {
        type: 'RAML 1.0',
      });
      await generator(files, opts);
      const exists = await fs.pathExists(compactModelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(compactModelFile);
      assertValidAmfModel(data);
    });

    it('generates model with options (Array)', async () => {
      files.set('apis/raml1.raml', ['RAML 1.0', 'application/raml', 'editing']);
      await generator(files, opts);
      const exists = await fs.pathExists(compactModelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(compactModelFile);
      assertValidAmfModel(data);
    });

    it('uses default values (Array)', async () => {
      files.set('apis/raml1.raml', ['RAML 1.0']);
      await generator(files, opts);
      const exists = await fs.pathExists(compactModelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(compactModelFile);
      assertValidAmfModel(data);
    });
  });

  describe('RAML 0.8 data model generation', () => {
    let files;
    let opts;
    const modelFile = path.join(dest, 'raml08.json');
    const compactModelFile = path.join(dest, 'raml08-compact.json');

    beforeEach(() => {
      files = new Map();
      files.set('apis/raml08.raml', 'RAML 0.8');
      opts = {
        src: srcDir,
        dest,
      };
    });

    afterEach(() => fs.remove(dest));

    it('Generates data model for regular model', () => generator(files, opts)
    .then(() => fs.pathExists(modelFile))
    .then((exists) => assert.isTrue(exists))
    .then(() => fs.readJson(modelFile))
    .then((data) => {
      assertValidAmfModel(data);
    }));

    it('Generates data model for compact model', () => generator(files, opts)
    .then(() => fs.pathExists(compactModelFile))
    .then((exists) => assert.isTrue(exists))
    .then(() => fs.readJson(compactModelFile))
    .then((data) => {
      assertValidAmfModel(data);
    }));
  });

  describe('Api list config file', () => {
    let opts;
    const modelFile = path.join(dest, 'raml1.json');
    const compactModelFile = path.join(dest, 'raml1-compact.json');
    const configFile = path.join('test', 'apis.json');
    beforeEach(() => {
      opts = {
        src: srcDir,
        dest,
      };
    });

    afterEach(() => fs.remove(dest));

    it('Generates data model for regular model', () => generator(configFile, opts)
    .then(() => fs.pathExists(modelFile))
    .then((exists) => assert.isTrue(exists))
    .then(() => fs.readJson(modelFile))
    .then((data) => {
      assertValidAmfModel(data);
    }));

    it('Generates data model for compact model', () => generator(configFile, opts)
    .then(() => fs.pathExists(compactModelFile))
    .then((exists) => assert.isTrue(exists))
    .then(() => fs.readJson(compactModelFile))
    .then((data) => {
      assertValidAmfModel(data);
    }));
  });

  describe('Api list config file with options', () => {
    const modelFile = path.join(dest, 'raml1.json');
    const compactModelFile = path.join(dest, 'raml1-compact.json');
    const flattenedModelFile = path.join(dest, 'flattenedApi.json');
    const compactFlattenedModelFile = path.join(dest, 'flattenedApi-compact.json');
    const configFile = path.join('test', 'apis-options.json');

    afterEach(() => fs.remove(dest));

    it('Generates data model for regular model', () => generator(configFile)
    .then(() => fs.pathExists(modelFile))
    .then((exists) => assert.isTrue(exists))
    .then(() => fs.readJson(modelFile))
    .then((data) => {
      assertValidAmfModel(data);
    }));

    it('Generates flattened data model for compact model', () => generator(configFile)
    .then(() => fs.pathExists(compactModelFile))
    .then((exists) => assert.isTrue(exists))
    .then(() => fs.readJson(compactModelFile))
    .then((data) => {
      assertValidAmfModel(data);
    }));

    it('Generates flattened data model for regular model', () => generator(configFile)
    .then(() => fs.pathExists(flattenedModelFile))
    .then((exists) => assert.isTrue(exists))
    .then(() => fs.readJson(flattenedModelFile))
    .then((data) => {
      assertValidAmfModel(data);
    }));

    it('Generates flattened data model for compact model', () => generator(configFile)
    .then(() => fs.pathExists(compactFlattenedModelFile))
    .then((exists) => assert.isTrue(exists))
    .then(() => fs.readJson(compactFlattenedModelFile))
    .then((data) => {
      assertValidAmfModel(data);
    }));
  });

  describe('Function call options overrides file options', () => {
    const alteredDest = path.join(dest, 'altered');
    const modelFile = path.join(alteredDest, 'raml1.json');
    const compactModelFile = path.join(alteredDest, 'raml1-compact.json');
    const configFile = path.join('test', 'apis-options.json');

    afterEach(() => fs.remove(dest));

    it('Generates data model for regular model', () => generator(configFile, {
      dest: alteredDest,
    })
    .then(() => fs.pathExists(modelFile))
    .then((exists) => assert.isTrue(exists))
    .then(() => fs.readJson(modelFile))
    .then((data) => {
      assertValidAmfModel(data);
    }));

    it('Generates data model for compact model', () => generator(configFile, {
      dest: alteredDest,
    })
    .then(() => fs.pathExists(compactModelFile))
    .then((exists) => assert.isTrue(exists))
    .then(() => fs.readJson(compactModelFile))
    .then((data) => {
      assertValidAmfModel(data);
    }));
  });

  describe('AsyncAPI 2.0 data model generation', () => {
    let files;
    let opts;

    const modelFile = path.join(dest, 'asyncApi20.json');
    const compactModelFile = path.join(dest, 'asyncApi20-compact.json');

    beforeEach(() => {
      files = new Map();
      opts = {
        src: srcDir,
        dest,
      };
    });

    afterEach(() => fs.remove(dest));

    it('Generates data model for regular model', async () => {
      files.set('apis/asyncApi20.yaml', { 'type': 'ASYNC 2.0', 'mime': 'application/yaml' });
      await generator(files, opts);
      const exists = await fs.pathExists(modelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(modelFile);
      assertValidAmfModel(data);
    });

    it('Generates data model for compact model', async () => {
      files.set('apis/asyncApi20.yaml', { 'type': 'ASYNC 2.0', 'mime': 'application/yaml' });
      await generator(files, opts);
      const exists = await fs.pathExists(compactModelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(compactModelFile);
      assertValidAmfModel(data);
    });
  });

  describe('gRPC data model generation', () => {
    let files;
    let opts;

    const modelFile = path.join(dest, 'grpc-test.json');
    const compactModelFile = path.join(dest, 'grpc-test-compact.json');

    beforeEach(() => {
      files = new Map();
      opts = {
        src: srcDir,
        dest,
      };
    });

    afterEach(() => fs.remove(dest));

    it('Generates data model for regular model', async () => {
      files.set('apis/grpc-test.proto', 'GRPC');
      await generator(files, opts);
      const exists = await fs.pathExists(modelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(modelFile);
      assertValidAmfModel(data);
    });

    it('Generates data model for compact model', async () => {
      files.set('apis/grpc-test.proto', 'GRPC');
      await generator(files, opts);
      const exists = await fs.pathExists(compactModelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(compactModelFile);
      assertValidAmfModel(data);
    });

    it('Generates data model with grpc string format', async () => {
      files.set('apis/grpc-test.proto', 'GRPC');
      await generator(files, opts);
      const exists = await fs.pathExists(modelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(modelFile);
      assertValidAmfModel(data);
      // Verify it's a gRPC/WebAPI model (type may be compact or full URI)
      const graph = data['@graph'];
      const webApi = graph.find(node => node['@type'] && node['@type'].some(t => t.includes('WebAPI')));
      assert.isDefined(webApi, 'Should contain WebAPI node');
    });
  });

  describe('generator.generate()', () => {
    let opts;

    const modelFile = path.join(dest, 'raml1.json');

    beforeEach(() => {
      opts = {
        src: srcDir,
        dest,
      };
    });

    afterEach(() => fs.remove(dest));

    it('generates the model file', async () => {
      /** @type Map<string, ApiConfiguration> */
      const files = new Map();
      files.set('apis/raml1.raml', { type: 'RAML 1.0' });
      await generator.generate(files, opts);
      const exists = await fs.pathExists(modelFile);
      assert.isTrue(exists, 'model file exists');
      const data = await fs.readJson(modelFile);
      assertValidAmfModel(data);
    });
  });

  describe('New spec generation', () => {
    const dest = path.join('test', 'playground');
    const srcDir = 'test/';

    const cases = [
      { file: 'apis/oas31.yaml', type: 'OAS 3.1', out: 'oas31' },
      { file: 'apis/oas32.yaml', type: 'OAS 3.2', out: 'oas32' },
      { file: 'apis/asyncApi30.yaml', type: 'ASYNC 3.0', out: 'asyncApi30' },
      { file: 'apis/asyncApi31.yaml', type: 'ASYNC 3.1', out: 'asyncApi31' },
    ];

    cases.forEach(({ file, type, out }) => {
      describe(`${type} model generation`, () => {
        afterEach(() => fs.remove(dest));

        it(`generates a valid compact model for ${type}`, async () => {
          const files = new Map();
          files.set(file, { type, mime: 'application/yaml' });
          await generator(files, { src: srcDir, dest });
          const compact = await fs.readJson(path.join(dest, `${out}-compact.json`));
          assertValidAmfModel(compact);
        });
      });
    });
  });
});
