import { CubeTransparentIcon } from "@heroicons/react/24/solid";
function Spinner({
    className = "flex items-center justify-center col-span-full",
    iconClassName = "w-8 h-8",
}) {
    return (
        <div className={className}>
            <CubeTransparentIcon
                className={`${iconClassName} animate-spin [animation-duration:1.5s]`}
            />
        </div>
    );
}

export default Spinner;
