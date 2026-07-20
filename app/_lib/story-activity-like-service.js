const likeTargetConfig = {
    rating: {
        relationModel: "ratingLike",
        relationField: "ratingId",
        counterModel: "rating",
    },
    ratingComment: {
        relationModel: "ratingCommentLike",
        relationField: "ratingCommentId",
    },
    discussion: {
        relationModel: "discussLike",
        relationField: "discussId",
        counterModel: "discuss",
    },
};

function normalizeLikeInput({ target, targetId, liked }) {
    const numericTargetId = Number(targetId);

    if (!likeTargetConfig[target]) {
        throw new Error("Loại lượt thích không hợp lệ");
    }
    if (!Number.isInteger(numericTargetId) || numericTargetId <= 0) {
        throw new Error("Đối tượng lượt thích không hợp lệ");
    }
    if (typeof liked !== "boolean") {
        throw new Error("Trạng thái lượt thích không hợp lệ");
    }

    return { target, targetId: numericTargetId, liked };
}

async function setActivityLikeState({ tx, userId, target, targetId, liked }) {
    const input = normalizeLikeInput({ target, targetId, liked });
    const config = likeTargetConfig[input.target];
    const relationWhere = {
        userId,
        [config.relationField]: input.targetId,
    };
    const relationResult = input.liked
        ? await tx[config.relationModel].createMany({
              data: relationWhere,
              skipDuplicates: true,
          })
        : await tx[config.relationModel].deleteMany({
              where: relationWhere,
          });
    const changed = relationResult.count === 1;

    if (changed && config.counterModel) {
        const counterResult = await tx[config.counterModel].updateMany({
            where: {
                id: input.targetId,
                ...(!input.liked ? { likeCount: { gt: 0 } } : {}),
            },
            data: {
                likeCount: {
                    [input.liked ? "increment" : "decrement"]: 1,
                },
            },
        });

        if (counterResult.count !== 1) {
            throw new Error("Không thể đồng bộ số lượt thích");
        }
    }

    return {
        target: input.target,
        targetId: input.targetId,
        liked: input.liked,
        changed,
    };
}

export { normalizeLikeInput, setActivityLikeState };
