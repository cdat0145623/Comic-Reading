const TIME_OPTIONS = [5, 10, 15, 30, 60];
function SelectMinutes({ minutes, setMinutes }) {
    return (
        <div className="flex space-x-2">
            <select
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-24 rounded-md border border-gray-300 text-xs custom-select-arrow"
            >
                {TIME_OPTIONS.map((time) => (
                    <option value={time} key={time}>{`${time} phút`}</option>
                ))}
            </select>
        </div>
    );
}

export default SelectMinutes;
