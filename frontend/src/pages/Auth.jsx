import { useState } from 'react';
import { ArrowLeft,Eye,EyeOff,Info,KeyRound,LockKeyhole,MailCheck,ShieldCheck } from 'lucide-react';
import { Link,useLocation,useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { AGE_OPTIONS,PHARMACIST_SUPPORT_OPTIONS,SERVICE_GOAL_OPTIONS,US_STATES } from '../data/registrationOptions';

export default function Auth({mode='login'}){
  const register=mode==='register';
  const forgot=mode==='forgot';
  const[show,setShow]=useState(false);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const[step,setStep]=useState('form');
  const[challenge,setChallenge]=useState(null);
  const[resetToken,setResetToken]=useState('');
  const[ageRange,setAgeRange]=useState('');
  const[serviceGoal,setServiceGoal]=useState('');
  const{setUser,setNotice}=useApp();
  const navigate=useNavigate();
  const location=useLocation();
  const requestedReturn=new URLSearchParams(location.search).get('returnTo');
  const returnTo=requestedReturn?.startsWith('/')&&!requestedReturn.startsWith('//')?requestedReturn:'/account';

  const submitCredentials=async event=>{
    event.preventDefault();
    setBusy(true);
    setError('');
    const form=Object.fromEntries(new FormData(event.currentTarget));
    try{
      const result=forgot?await api.forgotPassword({email:form.email}):register?await api.register(form):await api.login(form);
      if(!forgot&&!register){
        setUser(result.data.user);
        setNotice({type:'success',message:'Signed in successfully.'});
        navigate(returnTo);
        return;
      }
      setChallenge(result.data);
      setStep('otp');
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };
  const verify=async event=>{
    event.preventDefault();
    setBusy(true);
    setError('');
    const code=new FormData(event.currentTarget).get('code');
    try{
      const result=await api.verifyOtp({challengeId:challenge.challengeId,code,purpose:challenge.purpose});
      if(challenge.purpose==='PASSWORD_RESET'){
        setResetToken(result.data.resetToken);
        setStep('new-password');
      }else{
        setUser(result.data.user);
        setNotice({type:'success',message:'Your account is verified and secure.'});
        navigate(returnTo);
      }
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };
  const reset=async event=>{
    event.preventDefault();
    setBusy(true);
    setError('');
    const password=new FormData(event.currentTarget).get('password');
    try{
      await api.resetPassword({resetToken,password});
      setNotice({type:'success',message:'Password updated. Sign in with your new password.'});
      navigate('/login');
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };
  const resend=async()=>{
    setBusy(true);
    setError('');
    try{
      const result=await api.resendOtp({challengeId:challenge.challengeId});
      setChallenge(result.data);
      setNotice({type:'success',message:'A new code was sent.'});
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };

  return <div className={`auth-page${register?' auth-page--register':''}`}>
    <div className="auth-aside">
      <span className="eyebrow light">Protected at every step</span>
      <h1>{forgot?'Recover securely.':register?'Your account, verified.':'Welcome back.'}</h1>
      <p>{step==='otp'?'Enter the one-time code sent to your email. Codes expire after 10 minutes and can be used only once.':register?'Answer a few essential questions, then verify your email before account access.':forgot?'We will send a one-time password-reset code to your verified email.':'Sign in directly with the password for your verified account.'}</p>
      <div><span><LockKeyhole/> Argon2id password hashing</span><span><KeyRound/> OTP verification during signup</span><span><ShieldCheck/> Privacy-minimized onboarding</span></div>
    </div>
    <div className="auth-card">
      {step==='form'&&<>
        <span className="eyebrow">{forgot?'Account recovery':register?'Create account':'Secure sign in'}</span>
        <h2>{forgot?'Forgot your password?':register?'Let’s get started.':'Good to see you.'}</h2>
        <p>{forgot?'Enter your verified email. The response stays the same whether or not an account exists.':register?'These answers help confirm eligibility and route you to the right pharmacy support.':'Enter your email and password to access your account.'}</p>
        <form onSubmit={submitCredentials}>
          {register&&<>
            <div className="privacy-minimum"><Info/><span><b>Only the essentials.</b> We do not ask for symptoms, diagnoses, medication lists, or treatment history during account registration.</span></div>
            <fieldset className="registration-questions">
              <legend>About you</legend>
              <div className="field-row"><label>First name<input required name="firstName" autoComplete="given-name"/></label><label>Last name<input required name="lastName" autoComplete="family-name"/></label></div>
              <label><span className="question-label"><b>1</b> What is your age range?</span><select required name="ageRange" value={ageRange} onChange={event=>setAgeRange(event.target.value)}><option value="">Select an age range</option>{AGE_OPTIONS.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select><small>Customers must be 18 or older to create an account.</small></label>
              {ageRange==='UNDER_18'&&<p className="eligibility-note eligibility-note--warning" role="alert">You must be 18 or older to create an EMBODY Pharmacy account.</p>}
              <label><span className="question-label"><b>2</b> Which U.S. state do you live in?</span><select required name="state" autoComplete="address-level1"><option value="">Select your state</option>{US_STATES.map(state=><option key={state.value} value={state.value}>{state.label}</option>)}</select><small>State pharmacy rules and service availability can differ.</small></label>
              <label><span className="question-label"><b>3</b> What would you mainly like help with?</span><select required name="serviceGoal" value={serviceGoal} onChange={event=>setServiceGoal(event.target.value)}><option value="">Select one</option>{SERVICE_GOAL_OPTIONS.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              {serviceGoal==='EXISTING_PRESCRIPTION'&&<p className="eligibility-note">Prescription fulfillment requires a valid prescription and pharmacist review. Creating an account does not guarantee fulfillment.</p>}
              <label><span className="question-label"><b>4</b> Would you like help from a pharmacist?</span><select required name="pharmacistSupport"><option value="">Select one</option>{PHARMACIST_SUPPORT_OPTIONS.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            </fieldset>
          </>}
          <label>Email address<input required type="email" name="email" autoComplete="email"/></label>
          {!forgot&&<PasswordField show={show} setShow={setShow}/>} 
          {register&&<div className="registration-consents">
            <label className="checkbox"><input required type="checkbox" name="termsAccepted" value="true"/><span>I agree to the <Link to="/policies/terms">Terms of Use</Link>.</span></label>
            <label className="checkbox"><input required type="checkbox" name="privacyAcknowledged" value="true"/><span>I acknowledge the <Link to="/policies/privacy">Privacy Notice</Link>.</span></label>
            <label className="checkbox optional"><input type="checkbox" name="marketing" value="true"/><span>Send occasional updates. Optional and never required for pharmacy service.</span></label>
          </div>}
          {register&&<p className="registration-disclaimer">These answers do not diagnose a condition, recommend a medicine, or establish prescription eligibility.</p>}
          {error&&<p className="form-error" role="alert">{error}</p>}
          <button disabled={busy||ageRange==='UNDER_18'} className="btn btn-primary btn-wide">{busy?'Please wait…':forgot?'Send reset code':register?'Create and verify account':'Sign in'}</button>
        </form>
        {!forgot&&<p className="auth-switch">{register?'Already have an account?':'New to EMBODY?'} <Link to={`${register?'/login':'/register'}${returnTo!=='/account'?`?returnTo=${encodeURIComponent(returnTo)}`:''}`}>{register?'Sign in':'Create an account'}</Link></p>}
        {!register&&!forgot&&<Link className="forgot-link" to="/forgot-password">Forgot password?</Link>}
      </>}
      {step==='otp'&&<><button className="back-link plain" onClick={()=>{setStep('form');setError('')}}><ArrowLeft/> Start again</button><MailCheck className="auth-icon"/><span className="eyebrow">Email verification</span><h2>Check your inbox.</h2><p>Enter the six-digit code {challenge.maskedEmail?`sent to ${challenge.maskedEmail}`:'if an eligible account exists'}. Never share this code.</p><form onSubmit={verify}><label>One-time code<input className="otp-input" required name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" placeholder="000000"/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button disabled={busy} className="btn btn-primary btn-wide">{busy?'Verifying…':'Verify code'}</button><button disabled={busy} type="button" className="resend-button" onClick={resend}>Send a new code</button></form></>}
      {step==='new-password'&&<><KeyRound className="auth-icon"/><span className="eyebrow">New password</span><h2>Choose a strong password.</h2><p>Use at least 12 characters with uppercase, lowercase, number, and symbol.</p><form onSubmit={reset}><PasswordField show={show} setShow={setShow}/>{error&&<p className="form-error" role="alert">{error}</p>}<button disabled={busy} className="btn btn-primary btn-wide">{busy?'Updating…':'Update password'}</button></form></>}
    </div>
  </div>;
}

function PasswordField({show,setShow}){
  const{pathname}=useLocation();
  return <label>Password<div className="password-field"><input required minLength="12" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}" type={show?'text':'password'} name="password" autoComplete={pathname==='/login'?'current-password':'new-password'}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'}>{show?<EyeOff/>:<Eye/>}</button></div><small>12+ characters with uppercase, lowercase, number, and symbol.</small></label>;
}
