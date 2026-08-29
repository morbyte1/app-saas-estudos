'use client'

import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-800">
        <h1 className="text-3xl font-bold text-center mb-6">Revyza</h1>

        <form className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            required
            placeholder="Seu e-mail"
            className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-blue-500"
          />

          <input
            type="password"
            name="password"
            required
            placeholder="Sua senha"
            className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-blue-500"
          />

          <button
            formAction={login}
            type="submit"
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Entrar
          </button>

          <button
            formAction={signup}
            type="submit"
            className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition border border-zinc-700"
          >
            Cadastrar
          </button>
        </form>
      </div>
    </main>
  )
}
