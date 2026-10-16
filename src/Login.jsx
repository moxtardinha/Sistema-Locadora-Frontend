import { useEffect, useState } from 'react'
import axios from 'axios';
import validator from 'validator'
import './styles/Login.css'
import { useNavigate } from 'react-router-dom';

function Login() {
  const [ inputCpf,setInputCpf ] = useState(null);
  const [ inputSenha, setInputSenha ] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const getToken = localStorage.getItem("token");
    if (getToken) {
      navigate("/dashboard")
    }
  }, [])
  async function logar() {
    try {
      if (!inputCpf || !inputSenha) {
        return window.alert("Usuário ou Senha em formato Inválido")
      }
      if (!validator.isNumeric(inputCpf) || inputCpf.length !== 11) {
        return window.alert("CPF suporta apenas Números e 11 Digitos Apenas")
      }
      const loginReq = await axios.post("http://localhost:5000/funcionarios/login", {
        cpf: inputCpf,
        senha: inputSenha
      })
      if (loginReq.status === 500) {
        window.alert("Erro Interno no Servidor")
      }
      if (loginReq.status !== 200) {
        window.alert(loginReq.data.message)
      }
      localStorage.setItem("token", loginReq.data.token)
      navigate("/dashboard")
    }catch(err) {
      console.error(err);
      window.alert("Não foi possivel Logar!")
    }
  }
  return (
    <main>
      <div className="login p-5 shadow">
        <h1 className='fs-2'>Sistema-Locadora</h1>
        <label htmlFor="inputCPF">CPF</label>
        <input
          type="text"
          id="inputCPF"
          className="form-control"
          placeholder="Digite seu CPF"
          onChange={(e) => setInputCpf(e.target.value)}
        />

        <label htmlFor="inputSenha">Senha</label>
        <input
          type="password"
          id="inputSenha"
          className="form-control"
          placeholder="Digite sua senha"
          onChange={(e) => setInputSenha(e.target.value)}
        />
        <button className='btn btn-primary' onClick={logar}>Entrar</button>
      </div>
    </main>
  );
}

export default Login
