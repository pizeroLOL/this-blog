import { createResource, onCleanup, Show } from "solid-js";
import { z } from "zod";
import timeFormat from "../../scripts/timeFormat";

const schema = z.object({
  status: z.enum(["online", "busy", "offline"]),
  timestamp: z.number(),
});

const statusMap = {
  offline: {
    text: "离线",
    color: "bg-gray-500",
  },
  online: {
    text: "在线",
    color: "bg-green-500",
  },
  busy: {
    text: "繁忙",
    color: "bg-orange-500",
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
  const classList = ["w-2 h-2 rounded-full", props.color].join(" ");
  return (
    <div class="flex gap-2 items-center">
      <div class={classList}></div>
      <div>{props.text}</div>
      {props.text == "离线" && props.lastOnline && (
        <div>{props.lastOnline}</div>
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
