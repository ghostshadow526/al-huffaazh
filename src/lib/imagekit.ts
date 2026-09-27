import ImageKit from "imagekit";

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/demo";
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "public_demo";
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "private_demo";

const imagekit = new ImageKit({
  urlEndpoint,
  publicKey,
  privateKey,
});

export default imagekit;
