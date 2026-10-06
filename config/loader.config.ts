import { waitForInit } from "@backtest-kit/mongo";
import {
  Launcher,
  listenError,
  Log,
} from "backtest-kit";
import { errorData, getErrorMessage } from "functools-kit";

Launcher.run();

listenError((error) => {
  console.log(error);
  Log.debug("error", {
    error: errorData(error),
    message: getErrorMessage(error),
  });
});

export default async () => {
  await waitForInit();
}
