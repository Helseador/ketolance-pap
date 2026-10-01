export const dynamic = "force-dynamic";
import { createUserAction as createUser, listUsersAction as listUsers } from "@/app/actions/users";

export default async function UsuariosPage() {
  const users = await listUsers();

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold">Usuarios internos</h2>
      <form action={createUser} className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-card p-4 sm:grid-cols-2">
        <input name="name" placeholder="Nombre" required className="rounded border px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="Correo" required className="rounded border px-3 py-2 text-sm" />
        <input
          name="password"
          type="password"
          placeholder="Contraseña (8+)"
          required
          className="rounded border px-3 py-2 text-sm"
        />
        <select name="role" className="rounded border px-3 py-2 text-sm">
          <option value="NUTRICIONISTA">Nutricionista</option>
          <option value="EMPRESA">Empresa</option>
          <option value="SUPERADMIN">Superadmin</option>
        </select>
        <button className="sm:col-span-2 rounded bg-brand px-3 py-2 text-sm text-white">
          Crear usuario
        </button>
      </form>

      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b text-zinc-500">
            <th className="py-2">Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="py-2">{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
