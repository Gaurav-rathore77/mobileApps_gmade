import ImageKit from "imagekit-javascript";
import { API_URLS } from "../app/config/mobile";

const imagekit = new ImageKit({
  publicKey: "public_XiBBoC8s7KdL/fXGGeOUMxAl8cU=",
  urlEndpoint: "https://ik.imagekit.io/hvyv0mo68",
});

export const uploadImageFromUriFixed = async (uri: string, fileName: string, folder: string = "/profile-images"): Promise<string> => {
  try {
    // Step 1: Get auth from backend
    let authResponse;
    let authParams;
    
    // Try different URLs in order of preference using mobile config
    const urls = [
      ...API_URLS,
      'http://localhost:3000',     
      'http://192.168.1.8:3000'     
    ];
    
    for (const url of urls) {
      try {
        console.log(`🔍 Trying ImageKit auth at: ${url}/auth/imagekit`);
        authResponse = await fetch(`${url}/auth/imagekit`);
        console.log(`📊 Response status: ${authResponse?.status}`);
        
        if (authResponse && authResponse.ok) {
          authParams = await authResponse.json();
          console.log(`✅ Auth successful from: ${url}`);
          break;
        } else {
          console.log(`❌ Failed response from: ${url}`);
        }
      } catch (error) {
        console.log(`❌ Error connecting to ${url}:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }
    
    if (!authParams) {
      throw new Error('Could not get auth parameters from backend. Make sure backend is running on localhost:3000');
    }
    
    // Step 2: Convert React Native URI to base64
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
    
    // ImageKit needs base64 with proper prefix
    const file = `data:image/jpeg;base64,${base64Data}`;
    
    // Step 3: Upload with auth
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        file: file,
        fileName: fileName,
        folder: folder,
        signature: authParams.signature,
        token: authParams.token,
        expire: authParams.expire,
        useUniqueFileName: true,
      };
      
      imagekit.upload(
        uploadOptions,
        function (err: Error | null, result: { url: string; [key: string]: any } | null) {
          if (err) {
            reject(new Error(`ImageKit upload failed: ${err.message || 'Unknown error'}`));
          } else if (result) {
            resolve(result.url);
          } else {
            reject(new Error("Upload failed - no result returned from ImageKit"));
          }
        }
      );
    });
    
  } catch (error) {
    throw error;
  }
};
