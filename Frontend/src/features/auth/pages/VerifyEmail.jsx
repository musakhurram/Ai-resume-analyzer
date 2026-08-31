import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import AuthLayout from "../components/AuthLayout";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import { verifyEmail, resendVerification } from "../services/auth.api";
import "../auth.form.scss";

export default function VerifyEmail(){
 const [params]=useSearchParams(); const token=params.get("token")||""; const[email,setEmail]=useState(()=>localStorage.getItem("ra_pending_verification_email")||""); const[state,setState]=useState({loading:Boolean(token),message:"",error:""}); const[sending,setSending]=useState(false);
 useEffect(()=>{if(!token)return;verifyEmail(token).then(data=>{localStorage.removeItem("ra_pending_verification_email");setState({loading:false,message:data.message,error:""})}).catch(err=>setState({loading:false,message:"",error:err.response?.data?.message||"Unable to verify this email."}))},[token]);
 const resend=async()=>{if(!email)return setState(s=>({...s,error:"Enter your email address to resend the verification link."}));setSending(true);setState(s=>({...s,error:"",message:""}));try{const data=await resendVerification(email);setState(s=>({...s,message:data.message}))}catch(err){setState(s=>({...s,error:err.response?.data?.message||"Unable to resend the verification email."}))}finally{setSending(false)}};
 return <AuthLayout eyebrow="Email verification" title={token?(state.loading?"Verifying your email…":state.message?"Email verified":"Verification failed"):"Check your inbox"}>{state.loading&&<p>Please wait while we confirm your email address.</p>}{state.message&&<Callout tone="success">{state.message}</Callout>}{state.error&&<Callout tone="error">{state.error}</Callout>}{!token&&!state.message&&<><p>We sent a verification link to your email. Open it to verify your account.</p><div className="auth-form"><input className="auth-form__input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@domain.com"/><Button size="lg" variant="secondary" loading={sending} disabled={sending||!email.trim()} onClick={resend}>Resend verification email</Button></div></>}<p className="auth-form__switch"><Link to="/login">Continue to sign in</Link></p></AuthLayout>;
}
