export const validateEnvs = () => {
  const { MAINNET_NODE_URI, MAINNET_PRIVATE_KEY } = process.env;

  if (!MAINNET_NODE_URI) {
    throw new Error("env MAINNET_NODE_URI is required");
  }
};
