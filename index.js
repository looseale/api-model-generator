/* eslint-disable no-console */
const amf = require('amf-client-js');
const fs = require('fs-extra');
const path = require('path');

const {
  RAMLConfiguration,
  OASConfiguration,
  AsyncAPIConfiguration,
  GRPCConfiguration,
  RenderOptions,
  PipelineId,
} = amf;

/**
 * Strips AMF source-map nodes and inline source-map properties from a
 * serialised JSON-LD @graph string.
 *
 * AMF v5 only includes declared types (doc:declares) in the @graph when
 * withSourceMaps() is used.  For the compact model we want declares without
 * the source-map noise, so we generate with source maps and then strip them.
 *
 * @param {string} data Raw JSON-LD string
 * @returns {string} Stripped JSON-LD string
 */
function stripSourceMaps(data) {
  const obj = JSON.parse(data);
  const graph = obj['@graph'];
  if (!Array.isArray(graph)) return data;

  const filtered = graph.filter((node) => {
    const rawTypes = node['@type'];
    const joined = Array.isArray(rawTypes) ? rawTypes.join(',') : String(rawTypes || '');
    if (joined.includes('SourceMap') || joined.includes('source-maps')) return false;
    const id = node['@id'];
    if (typeof id === 'string' && id.includes('source-map')) return false;
    return true;
  });

  const sourceMapProps = [
    'http://a.ml/vocabularies/document-source-maps#sources',
    'http://a.ml/vocabularies/document-source-maps#lexical',
    'sourcemaps:sources',
    'sourcemaps:lexical',
    'sourcemaps:synthesized-field',
    'sourcemaps:grpc-raw-proto',
    'sourcemaps:element',
    'sourcemaps:value',
  ];
  for (const node of filtered) {
    for (const prop of sourceMapProps) {
      delete node[prop];
    }
  }

  return JSON.stringify({ ...obj, '@graph': filtered });
}

/** @typedef {import('./types').ApiConfiguration} ApiConfiguration */
/** @typedef {import('./types').FilePrepareResult} FilePrepareResult */
/** @typedef {import('./types').ApiGenerationOptions} ApiGenerationOptions */
/** @typedef {import('./types').ApiType} ApiType */

/**
 * @param {string} type
 * @returns {any}
 */
function getConfiguration(type) {
  switch (type) {
    case 'RAML 0.8': return RAMLConfiguration.RAML08();
    case 'RAML 1.0': return RAMLConfiguration.RAML10();
    case 'OAS 2.0':
    case 'OAS 2':
      return OASConfiguration.OAS20();
    case 'OAS 3.0':
    case 'OAS 3':
      return OASConfiguration.OAS30();
    case 'OAS 3.1': return OASConfiguration.OAS31();
    case 'OAS 3.2': return OASConfiguration.OAS32();
    case 'ASYNC 2.0': return AsyncAPIConfiguration.Async20();
    case 'GRPC': return GRPCConfiguration.GRPC();
    default: throw new Error(`Unknown API type: ${type}`);
  }
}

/**
 * Generates json/ld file from parsed document using AMF v5 API.
 *
 * Produces two output files:
 *   - `<name>.json`         — full model, expanded URIs, source maps controlled by `sourceMaps`
 *   - `<name>-compact.json` — compact URIs, never includes source maps (optimized for display)
 *
 * @param {string} sourceFile
 * @param {string} file
 * @param {string} type
 * @param {string} destPath
 * @param {string} resolution
 * @param {boolean} flattened
 * @param {boolean} sourceMaps
 * @return {Promise<void>}
 */
async function processFile(sourceFile, file, type, destPath, resolution, flattened, sourceMaps) {
  // Convert file path to output JSON path
  let dest = `${file.substr(0, file.lastIndexOf('.')) }.json`;
  if (dest.indexOf('/') !== -1) {
    dest = dest.substr(dest.lastIndexOf('/'));
  }

  // Parse using a base client (render options don't affect parsing).
  // AMF v5 mutates the baseUnit during transform/render so we must parse twice —
  // once for the full model and once for the compact model — to get independent
  // base units.
  const parseClient = getConfiguration(type).baseUnitClient();
  const parseResult = await parseClient.parse(sourceFile);

  if (!parseResult.conforms) {
    /* eslint-disable-next-line no-console */
    console.log('Validation warnings/errors:');
    console.log(parseResult.toString());
  }

  const pipelineId = resolution === 'editing' ? PipelineId.Editing : PipelineId.Default;
  const transformed = parseClient.transform(parseResult.baseUnit, pipelineId);

  // Fresh parse for compact model (avoids base-unit mutation by the full render above)
  const parseClientForCompact = getConfiguration(type).baseUnitClient();
  const parseResultForCompact = await parseClientForCompact.parse(sourceFile);
  const transformedForCompact = parseClientForCompact.transform(parseResultForCompact.baseUnit, pipelineId);

  const fullFile = path.join(destPath, dest);
  const compactDest = dest.replace('.json', '-compact.json');
  const compactFile = path.join(destPath, compactDest);

  // Full model: expanded URIs, source maps controlled by option (for editing tooling)
  // withoutCompactedEmission() is required: AMF v5 defaults to @graph (compacted emission),
  // but consumers like amf-loader.ts expect the old array format [{"@id": "amf://id", ...}].
  // Only flattened models intentionally use @graph.
  let fullRenderOpts = new RenderOptions().withoutCompactedEmission();
  if (sourceMaps) {
    fullRenderOpts = fullRenderOpts.withSourceMaps();
  }
  if (flattened) {
    fullRenderOpts = fullRenderOpts.withCompactedEmission();
  }
  const fullData = await getConfiguration(type)
    .withRenderOptions(fullRenderOpts)
    .baseUnitClient()
    .render(transformed.baseUnit, 'application/ld+json');

  await fs.ensureFile(fullFile);
  await fs.writeFile(fullFile, fullData, 'utf8');

  // Compact model: same as full model but with source maps stripped after rendering.
  // AMF v5 only includes doc:declares (type definitions) when withSourceMaps() is
  // active, so we must generate with source maps and remove them in post-processing.
  // withCompactUris() is omitted: it also drops declared types from the @graph.
  let compactRenderOpts = new RenderOptions().withSourceMaps().withoutCompactedEmission();
  if (flattened) {
    compactRenderOpts = compactRenderOpts.withCompactedEmission();
  }
  const compactRaw = await getConfiguration(type)
    .withRenderOptions(compactRenderOpts)
    .baseUnitClient()
    .render(transformedForCompact.baseUnit, 'application/ld+json');
  const compactData = flattened ? compactRaw : stripSourceMaps(compactRaw);

  await fs.ensureFile(compactFile);
  await fs.writeFile(compactFile, compactData, 'utf8');
}

/**
 * Normalizes input options to a common structure.
 * @param {ApiConfiguration|string|string[]} input User input
 * @return {ApiConfiguration} A resulting configuration options with
 */
function normalizeOptions(input) {
  if (Array.isArray(input)) {
    const [type, mime, resolution, flattened] = input;
    // @ts-ignore
    return { type, mime, resolution, flattened };
  }
  if (typeof input === 'object') {
    return input;
  }
  return {
    type: /** @type ApiType */ (input),
  };
}

/**
 * Parses file and sends it to process.
 *
 * @param {string} file File name in `demo` folder
 * @param {ApiConfiguration|string|string[]} cnf
 * @param {ApiGenerationOptions} opts Processing options
 * @return {Promise<void>}
 */
async function parseFile(file, cnf, opts) {
  let { src='demo/', dest='demo/' } = opts;
  if (!src.endsWith('/')) {
    src += '/';
  }
  if (!dest.endsWith('/')) {
    dest += '/';
  }
  const { type, mime='application/yaml', resolution='editing', flattened = false, sourceMaps = true } = normalizeOptions(cnf);
  const sourceFile = `file://${src}${file}`;
  return processFile(sourceFile, file, type, dest, resolution, flattened, sourceMaps);
}

/**
 * Reads `file` as JSON and creates a Map with definitions from the file.
 * The keys are paths to the API file relative to `opts.src` and values is
 * API type.
 * @param {string} file Path to a file definition.
 * @return {FilePrepareResult} The key is the api file location in the `opts.src`
 * directory. The value is the build configuration.
 */
function prepareFile(file) {
  file = path.resolve(process.cwd(), file);
  const data = require(file);
  const files = new Map();
  const opts = {};
  Object.keys(data).forEach((key) => {
    switch (key) {
      case 'src':
      case 'dest':
        opts[key] = data[key];
        break;
      default:
        files.set(key, data[key]);
        break;
    }
  });
  return {
    files,
    opts,
  };
}

/**
 * @param {string|Map<string, ApiConfiguration|string|string[]>} init If string then this is a location of
 * the file that holds processing configuration. Otherwise it is already prepared configuration.
 * @param {ApiGenerationOptions=} opts Processing options.
 * @return {Promise<void>}
 */
async function main(init, opts={}) {
  if (typeof init === 'string') {
    const { files: cnfFiles, opts: cnfOpts } = prepareFile(init);
    init = cnfFiles;
    opts = { ...cnfOpts, ...opts };
  }
  // AMF v5 doesn't require explicit initialization
  for (const [file, type] of init) {
    await parseFile(file, type, opts);
  }
}

/**
 * Runs the default function and exists the process when failed.
 * @param {Map<string, ApiConfiguration>} init The list of files to parse with their configuration.
 * @param {ApiGenerationOptions=} opts Optional parsing options.
 */
async function generate(init, opts) {
  try {
    console.log(`Generating graph models for ${init.size} api(s).`);
    await main(init, opts);
    console.log('Models created');
  } catch (cause) {
    console.error(cause);
    throw new Error('Unable to process APIs.');
  }
}

const myModule = module.exports = main;
myModule.generate = generate;
