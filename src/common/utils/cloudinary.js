import { v2 as cloudinary } from 'cloudinary';

// الربط المباشر بالقيم (Hardcoded) لضمان التشغيل الفوري 🚀
cloudinary.config({ 
  cloud_name: 'dkthrgzvj', 
  api_key: '747264442218389', 
  api_secret: 'gycsrIdYv4zfqmYMHWsecFczQ3I' 
});

console.log("Cloudinary Configured Directly ✅ - READY FOR SIGNUP");

export default cloudinary;