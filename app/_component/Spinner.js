import { CubeTransparentIcon } from "@heroicons/react/24/solid";
function Spinner() {
    return (
        <div className="flex items-center justify-center col-span-full">
            <CubeTransparentIcon className="w-8 h-8 animate-spin [animation-duration:1.5s]" />
        </div>
    );
}

export default Spinner;
