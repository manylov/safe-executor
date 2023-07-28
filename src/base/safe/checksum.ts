import web3 from "web3";
import { BatchFile } from "./models";

// JSON spec does not allow undefined so stringify removes the prop
// That's a problem for calculating the checksum back so this function avoid the issue
export const stringifyReplacer = (_: string, value: any) =>
  value === undefined ? null : value;

const serializeJSONObject = (json: any): string => {
  if (Array.isArray(json)) {
    return `[${json.map((el) => serializeJSONObject(el)).join(",")}]`;
  }

  if (typeof json === "object" && json !== null) {
    let acc = "";
    const keys = Object.keys(json).sort();
    acc += `{${JSON.stringify(keys, stringifyReplacer)}`;

    for (let i = 0; i < keys.length; i++) {
      acc += `${serializeJSONObject(json[keys[i]])},`;
    }

    return `${acc}}`;
  }

  return `${JSON.stringify(json, stringifyReplacer)}`;
};

const calculateChecksum = (batchFile: BatchFile): string | undefined => {
  const serialized = serializeJSONObject({
    ...batchFile,
    meta: { ...batchFile.meta, name: null },
  });
  const sha = web3.utils.sha3(serialized);

  return sha || undefined;
};

export const addChecksum = (batchFile: BatchFile): BatchFile => {
  return {
    ...batchFile,
    meta: {
      ...batchFile.meta,
      checksum: calculateChecksum(batchFile),
    },
  };
};
