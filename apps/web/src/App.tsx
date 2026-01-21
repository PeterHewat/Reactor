import { Button } from "@repo/ui";

function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-8 text-white">
      <h1 className="mb-4 text-4xl font-bold">Reactor</h1>
      <p className="mb-8 text-lg text-slate-300">React 19 + Convex + Clerk + Tailwind CSS</p>
      <div className="flex gap-4">
        <Button variant="primary" size="md">
          Get Started
        </Button>
        <Button variant="secondary" size="md">
          Learn More
        </Button>
      </div>
    </div>
  );
}

export default App;
