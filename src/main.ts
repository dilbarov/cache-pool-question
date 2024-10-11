import {Operation} from "./operation";

async function test() {
  await new Operation().execute();
  await new Operation().execute();
  console.log("Done");
}
test();

//BONUS: We should only see 1 download cache message
// const promise = new Promise(async () => await Promise.all([new Operation().execute(), new Operation().execute(), new Operation().execute()]));
// promise.then(() => console.log("Done"));
