import googleIcon from '../assets/google.svg'
import appleIcon from '../assets/apple.svg'

const SocialLogin = () => {
  return (
    <div className="social-login">
            <button className="social-button">
              <img src={googleIcon} alt="Google" className="social-icon" />
              Google
            </button>
            <button className="social-button">
              <img src={appleIcon} alt="Apple" className="social-icon" />
              Apple
            </button>
          </div>
  )
}

export default SocialLogin