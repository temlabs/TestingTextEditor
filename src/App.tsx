import Editor from "./Components/Editor";
import "./style.css";
import shortId from "shortid";

function App(): JSX.Element {
  return (
    <Editor id={shortId.generate()} displayIndex={0} type={"bold"} value={""} />
  );
}

export default App;
