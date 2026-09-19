import { CosmicParallaxBg } from "@/components/ui/parallax-cosmic-background";

const DemoOne = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center" style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <CosmicParallaxBg 
        head="EaseMize" 
        text="Easy, customizeable, Best" 
        loop={true}
      />
    </div>
  );
};

export { DemoOne };
export default DemoOne;
