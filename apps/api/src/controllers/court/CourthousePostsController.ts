import { Rank, User } from "@prisma/client";
import { BodyParams, Context, Controller, PathParams, UseBeforeEach } from "@tsed/common";
import { ContentType, Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { Permissions, UsePermissions } from "middlewares/UsePermissions";
import { COURTHOUSE_POST_SCHEMA } from "@snailycad/schemas";
import { userProperties } from "lib/auth/getSessionUser";
import { NotFound } from "@tsed/exceptions";
import type * as APITypes from "@snailycad/types/api";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";

@Controller("/courthouse-posts")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.COURTHOUSE })
export class CourthousePostsController {
  @Get("/")
  async getPosts(): Promise<APITypes.GetCourthousePostsData> {
    const posts = await prisma.courthousePost.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: userProperties } },
    });
    return posts;
  }

  @UsePermissions({
    fallback: (user) => user.rank !== Rank.USER,
    permissions: [Permissions.ManageCourthousePosts],
  })
  @Post("/")
  async createCourthousePost(
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PostCourthousePostsData> {
    const data = validateSchema(COURTHOUSE_POST_SCHEMA, body);

    const post = await prisma.courthousePost.create({
      data: {
        title: data.title,
        descriptionData: data.descriptionData,
        userId: user.id,
      },
      include: { user: { select: userProperties } },
    });

    return post;
  }

  @UsePermissions({
    fallback: (user) => user.rank !== Rank.USER,
    permissions: [Permissions.ManageCourthousePosts],
  })
  @Put("/:id")
  async updateCourthousePost(
    @PathParams("id") postId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCourthousePostsData> {
    const data = validateSchema(COURTHOUSE_POST_SCHEMA, body);

    const post = await prisma.courthousePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFound("Post not found");
    }

    const updated = await prisma.courthousePost.update({
      where: { id: post.id },
      data: {
        title: data.title,
        descriptionData: data.descriptionData,
      },
      include: { user: { select: userProperties } },
    });

    return updated;
  }

  @UsePermissions({
    fallback: (user) => user.rank !== Rank.USER,
    permissions: [Permissions.ManageCourthousePosts],
  })
  @Delete("/:id")
  async deleteCourthousePost(
    @PathParams("id") postId: string,
  ): Promise<APITypes.DeleteCourthousePostsData> {
    const post = await prisma.courthousePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFound("Post not found");
    }

    await prisma.courthousePost.delete({
      where: { id: post.id },
    });

    return true;
  }
}
