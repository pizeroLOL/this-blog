import { createResource, onCleanup, Show } from "solid-js";
import { z } from "zod";
import timeFormat from "../../scripts/timeFormat";

const schema = z.object({
  status: z.enum(["online", "busy", "offline"]),
  timestamp: z.number(),
});

/* 状态色取自 M3E 配色令牌（theme.css）：
 *   在线 = tertiary（蓝）· 繁忙 = primary（琥珀）· 离线 = outline（暖灰）
 */
const statusMap = {
  offline: {
    text: "离线",
    color: "bg-outline",
  },
  online: {
    text: "在线",
    color: "bg-tertiary",
  },
  busy: {
    text: "繁忙",
    color: "bg-primary",
  },
} as const;

type StatusType = {
  text: string;
  color: string;
  lastOnline?: string;
};

const getStatus = () =>
  fetch("https://doing.pizero.top")
    .then((it) => it.json())
    .then((it) => schema.parse(it))
    .then(
      (it) =>
        ({
          ...statusMap[it.status],
          lastOnline: timeFormat(new Date(it.timestamp)),
        }) as StatusType
    )
    .catch((e) => {
      console.error(e);
      return statusMap.offline as StatusType;
    });

const status = (props: StatusType) => {
  const dot = ["size-2 rounded-full", props.color].join(" ");
  return (
    <div class="m3-chip m3-chip-outline">
      <span class={dot}></span>
      <span>{props.text}</span>
      {props.text == "离线" && props.lastOnline && (
        <span class="opacity-70">{props.lastOnline}</span>
      )}
    </div>
  );
};

export default () => {
  const [data, { refetch }] = createResource(getStatus);
  const it = setInterval(refetch, 60 * 1000);
  onCleanup(() => {
    clearInterval(it);
  });
  return (
    <Show when={data()} fallback={status(statusMap.offline)}>
      {status(data() ?? statusMap.offline)}
    </Show>
  );
};
