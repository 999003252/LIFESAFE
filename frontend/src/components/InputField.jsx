const InputField = ({ type, placeholder, icon, value, onChange }) => {
  return (
    <div className="input-wrapper">
      <input
        type={type}
        placeholder={placeholder}
        className="input-field"
        value={value}
        onChange={onChange}
        required
      />
      <i className="material-symbols-rounded">{icon}</i>
    </div>
  )
}

export default InputField
