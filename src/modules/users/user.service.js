import { providerEnum } from "../../common/enum/user.enum.js";
import { successResponse } from "../../common/utils/response.success.js";
import {
  decrypt,
  encrypt,
} from "../../common/utils/security/encrypt.security.js";
import { Compare, Hash } from "../../common/utils/security/hash.security.js";
import { GenerateToken, VerifyToken } from "../../common/utils/token.service.js";
import {randomUUID} from "crypto"
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import  {OAuth2Client} from "google-auth-library"
import { ACCESS_SECRET_KEY, AUDIENCE, PREFIX, REFRESH_SECRET_KEY, SALT_ROUNDS} from "../../../config/config.service.js";
import { deleteKey, get, get_key, keys, revoked_key, setValue } from "../../DB/redis/redis.service.js";
import cloudinary from "../../common/utils/cloudinary.js";

export const signUp = async (req, res) => {
  const { firstName,lastName,userName, email, password, cPassword, phone, gender, role } =
    req.body;

  if (password !== cPassword) {
    throw new Error("Confirmed password must match the password 🔴", {
      cause: 400,
    });
  }

  if (await db_service.findOne({ model: userModel, filter: { email } })) {
    throw new Error(`Email ${email} already exist ❎`, { cause: 409 });
  }

 const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.files.attachments[0].path,
    { folder: "uploads/users" }
);
    
   const arr_paths = [];

for (const file of req.files.attachments) {

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    file.path,
    {
      folder: "uploads/users",
    }
  );

  arr_paths.push({ secure_url, public_id });
}

  const user = await db_service.create({
  model: userModel,
  data: {
    firstName, 
    lastName,  
    email,
    password: Hash({ plain_text: password, salt_rounds: SALT_ROUNDS }),
    phone: encrypt(phone),
    profilePicture: { secure_url, public_id }, 
  }
});

  successResponse({
    res,
    status: 201,
    message: `${userName} signed up successfully ✅`,
    data: user,
  });
};



export const signUpWithGmail = async (req,res) => {
  const {idToken} = req.body

  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
      idToken,
      audience: AUDIENCE
  });
  const payload = ticket.getPayload();
 
  const {name , email , email_verified , picture} = payload

  let user = await db_service.findOne({model:userModel , filter: {email}})
  
  if(!user){
    user = await db_service.create({
      model:userModel,
      data:{
        userName: name,
        email,
        confirmed: email_verified,
        profilePicture: picture,
        provider: providerEnum.google
          }
    })
  }

  if(user.provider == providerEnum.system){
    throw new Error("Please, Login with system" , {cause: 400})
  }

 const access_token = GenerateToken({ 
    payload: { id: user._id, email: user.email }, 
    signature: "Amr" 
});

  successResponse({res,message:"Success Login with gmail ✅" , data: {access_token}})
}


export const getProfile = async (req, res) => {

  const key = `profile::${req.user._id}`

  const userExist = await get(key)
  if(userExist){
    console.log(`From Cache`);
    return successResponse({res , data: userExist})
  }
  console.log(`Out Cache`);
  
  await setValue({key , value: req.user , ttl: 60 * 2})

  successResponse({res,data:{...req.user._doc , phone:decrypt(req.user.phone)}})
};

export const refreshToken = async (req,res) => {
  const {authorization} = req.headers

  
    if (!authorization) {
      throw new Error("Token is required 🔴", { cause: 400 });
    }
  
    const [prefix,token] = authorization.split(" ")
    if(prefix !== PREFIX){
      throw new Error("Ivalid prefix" , {cause: 400})
    }
  
    const decoded = VerifyToken({token , secret_key: REFRESH_SECRET_KEY})
  
    if (!decoded || !decoded?.id) {
      throw new Error("Invalid token ❎", { cause: 400 });
    }
  
    const user = await db_service.findById({model:userModel , id:decoded.id , options:{select:"-password"}})
  
    if(!user){
      throw new Error("User not found" , {cause: 404})
    }

      const revokeToken = await db_service.findOne({model:revokeTokenModel , filter:{tokenId: decoded.jti}})
    
      if(revokeToken){
        throw new Error("Token revoked ❎" , {cause: 400})
      }

    const jwtid = randomUUID()

      const access_token = GenerateToken({
        payload: { id: user._id },
        secret_key: ACCESS_SECRET_KEY,
        options: {
          jwtid
        },
      });

      successResponse({res, data: {access_token}})
}

export const shareProfile = async (req, res) => {
  const { id } = req.params;

  const user = await db_service.findById({
    model: userModel,
    id,
    options: { select: "-password" },
  });
  if (!user) {
    throw new Error("User not found", { cause: 404 });
  }
  user.phone = Decrypt(user.phone);
  successResponse({ res, data: user });
};

export const updateProfile = async (req,res) => {
  let {firstName,lastName,gender,phone} = req.body

  if(phone){
    phone = encrypt(phone)
  }

  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: {_id: req.user._id},
    update: {firstName,lastName,gender,phone},
  })

   if(!user){
    throw new Error("User not exist")
   }

   await deleteKey(`profile::${req.user._id}`)

   successResponse({res , data: user})
}

export const updatePassword = async (req,res) => {
  let {oldPassword,newPassword} = req.body

  if(!Compare({plain_text: oldPassword , cipher_text: req.user.password})){
    throw new Error("Invalid old password")
  }

    const hash = Hash({plain_text: newPassword, salt_rounds: SALT_ROUNDS})

    req.user.password = hash

  await req.user.save()

   successResponse({res})
}

export const logout = async (req,res) => {
  const {flag} = req.query

  if(flag == "all"){
    req.user.changeCredential = new Date()
    await req.user.save()
    await deleteKey(await keys(get_key(req.user._id)))
  } else {
    await setValue({
      key: revoked_key({userId: req.user._id , jti: req.decoded.jti}),
      value: req.decoded.jti,
      ttl: req.decoded.exp - Math.floor(Date.now() / 1000)
    })
  }
  successResponse({res})
}

// Upload Cover Images (Max 2)
export const uploadCover = async (req, res, next) => {
    const user = await userModel.findById(req.user.id);
    const existingCovers = user.coverPicture?.length || 0;
    const newCovers = req.files?.attachments?.length || 0;

    if (existingCovers + newCovers !== 2) {
        req.files.attachments.forEach(file => fs.unlinkSync(file.path));
        return next(new Error("Total cover images must be exactly 2 🔴", { cause: 400 }));
    }

    const updatedUser = await userModel.findByIdAndUpdate(req.user.id, 
        { $push: { coverPicture: { $each: req.files.attachments.map(f => f.path) } } }, 
        { new: true }
    );
    return res.status(200).json({ message: "Done ✅", updatedUser });
};

// Update Profile Picture (Move old to gallery)
export const updateProfilePic = async (req, res, next) => {
    const user = await userModel.findById(req.user.id);
    const oldPic = user.profilePicture;

    const updatedUser = await userModel.findByIdAndUpdate(req.user.id, {
        profilePicture: req.file.path, 
        $push: { gallery: oldPic }   
    }, { new: true });

    return res.status(200).json({ message: "Profile updated ✅", updatedUser });
};


// Remove Profile Picture
export const removeProfilePic = async (req, res, next) => {
    const user = await userModel.findById(req.user.id);
    
    if (user.profilePicture && fs.existsSync(user.profilePicture)) {
        fs.unlinkSync(user.profilePicture); 
    }

    await userModel.findByIdAndUpdate(req.user.id, { $set: { profilePicture: null } });
    return res.status(200).json({ message: "Image deleted from disk ✅" });
};



//Assignment13

export const signIn = async (req, res) => {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email, provider: "system" });

    if (!user) throw new Error("Invalid email", { cause: 400 });

    if (user.banUntil && user.banUntil > Date.now()) {
        const remaining = Math.ceil((user.banUntil - Date.now()) / 60000);
        throw new Error(`Banned! Try again after ${remaining} min`, { cause: 403 });
    }

    const match = Compare({ plain_text: password, cipher_text: user.password });
    
    if (!match) {
        user.failedAttempts += 1;
        if (user.failedAttempts >= 5) {
            user.banUntil = new Date(Date.now() + 5 * 60 * 1000); 
            user.failedAttempts = 0;
        }
        await user.save();
        throw new Error("Invalid password", { cause: 400 });
    }

    if (user.is2FAEnabled) {
        const otp = await generateOtp(); 
        await sendEmail({ to: email, html: `<h1>Login Code: ${otp}</h1>` });
        await setValue({ key: `2FA_login:${user._id}`, value: otp, ttl: 300 });  
        return res.status(200).json({ message: "OTP sent to email for 2FA" });
    }

    user.failedAttempts = 0;
    await user.save();
    const access_token = GenerateToken({ payload: { id: user._id }, secret_key: ACCESS_SECRET_KEY });
    return res.status(200).json({ message: "Logged in ✅", access_token });
};

// طلب تفعيل الـ 2FA
export const enable2FA = async (req, res) => {
    const otp = await generateOtp();
    await sendEmail({ to: req.user.email, html: `Enable 2FA Code: ${otp}` });
    await setValue({ key: `enable_2FA:${req.user._id}`, value: otp, ttl: 300 });
    return res.status(200).json({ message: "Check email for OTP" });
};

export const confirm2FA = async (req, res) => {
    const { otp } = req.body;
    const savedOtp = await get(`enable_2FA:${req.user._id}`);
    if (otp !== savedOtp) throw new Error("Invalid OTP", { cause: 400 });

    await userModel.findByIdAndUpdate(req.user._id, { is2FAEnabled: true });
    return res.status(200).json({ message: "2FA Enabled successfully ✅" });
};

// Forget Password

export const forgetPassword = async (req, res) => {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) throw new Error("User not found", { cause: 404 });

    const otp = await generateOtp();
    await sendEmail({ to: email, html: `Reset Code: ${otp}` });
    await setValue({ key: `reset_pass:${email}`, value: otp, ttl: 600 });
    return res.json({ message: "OTP sent" });
};

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const savedOtp = await get(`reset_pass:${email}`);
    if (otp !== savedOtp) throw new Error("Invalid OTP", { cause: 400 });

    const hash = Hash({ plain_text: newPassword, salt_rounds: 8 });
    await userModel.findOneAndUpdate({ email }, { password: hash, failedAttempts: 0 });
    return res.json({ message: "Password reset done ✅" });
};