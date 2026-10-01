import { listAuditLogsAction as listAuditLogs, revertLogAction } from "@/app/actions/audit";
import { formatBogota } from "@/lib/time";

export default async function AuditoriaPage() {
  const logs = await listAuditLogs();

  return (
    <div>
      <h2 className="text-2xl font-semibold">Auditoría</h2>
      <p className="text-sm text-zinc-600">
        Superadmin: historial de cambios y reversión de encuestas.
      </p>
      <table className="mt-6 w-full text-left text-xs">
        <thead>
          <tr className="border-b border-zinc-300 text-zinc-500">
            <th className="py-2">Fecha</th>
            <th>Actor</th>
            <th>Acción</th>
            <th>Entidad</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-zinc-200 align-top">
              <td className="py-2 whitespace-nowrap">{formatBogota(log.createdAt)}</td>
              <td>{log.actorName ?? "sistema"}</td>
              <td>
                {log.action}
                {log.reverted ? " (revertido)" : ""}
              </td>
              <td>
                {log.entityType} {log.entityId.slice(0, 8)}
              </td>
              <td>
                {log.entityType === "Survey" && !log.reverted && log.beforeJson ? (
                  <form action={revertLogAction}>
                    <input type="hidden" name="id" value={log.id} />
                    <button className="text-accent underline">Revertir</button>
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
