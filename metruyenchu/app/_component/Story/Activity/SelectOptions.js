const options = ["like", "recently", "oldest"];
function SelectOptions() {
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="space-x-3 flex items-center">
                <input
                    type="checkbox"
                    className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
                <span className="font-medium text-primary">Hiện tất cả</span>
            </div>
            <div>
                <h3 className="font-semibold">27 đánh giá</h3>
            </div>
            <div>
                <select
                    name=""
                    id=""
                    className="custom-select-arrow border border-gray-300 md:text-sm text-base rounded-md"
                >
                    <option value="">Lượt thích</option>
                    <option value="">Mới nhất</option>
                    <option value="">Cũ nhất</option>
                </select>
            </div>
        </div>
    );
}

export default SelectOptions;
