import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import { auth } from "express-oauth2-jwt-bearer";

// this is a middleware that will validate the access token sent by the client
const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: "RS256",
});

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// this is a public endpoint because it doesn't have the requireAuth middleware
app.get("/ping", (req, res) => {
  res.send("pong");
});


// get all reviews, anonymous user can also see top 10 reviews
app.get("/reviews", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const reviews = await prisma.reviewItem.findMany({
      include: {
        game: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(limit && { take: limit }), // Only include `take` if limit is defined
    });
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

// creates a review, require authentication 
app.post("/reviews", requireAuth, async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;

    const { gameName, title, reviewContent, rating } = req.body;

    // Input validation
    if (!title || !reviewContent || !gameName) {
      return res.status(400).send("All fields are required!");
    }

    if (!rating) {
      return res.status(400).send("Please give your rating");
    }

    if (title.length < 5 || title.length > 100) {
      return res.status(400).send("Title must be between 5 and 100 characters.");
    }

    if (reviewContent.length < 20 || reviewContent.length > 1000) {
      return res.status(400).send("Review content must be between 20 and 1000 characters.");
    }

    // Validate rating is an integer within the expected range
    const ratingInt = parseInt(rating);
    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return res.status(400).send("rating must be an integer between 1 and 5");
    }

    // if game not exist, create new 
    let game = await prisma.game.findUnique({
      where: { name: gameName },
    });
    if (!game) {
      game = await prisma.game.create({
        data: { name: gameName },
      });
    }

    // find the user by auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Create the review item
    const newItem = await prisma.reviewItem.create({
      data: {
        title: title,
        content: reviewContent,
        star: parseInt(rating),
        game: { connect: { id: game.id } },
        user: { connect: { id: user.id } },
      },
    });
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: error.message });
  }
});

// deletes a review item by id, require authentication 
app.delete("/review/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deletedItem = await prisma.reviewItem.delete({
      where: {
        id,
      },
    });
    res.json(deletedItem);
  } catch (error) {
    console.error('Error deleting review item:', error);
    res.status(500).json({ error: error.message });
  }
});

// get a review item by id, don't need authentication
app.get('/review/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const reviewItem = await prisma.reviewItem.findUnique({
      where: {
        id,
      },
      include: {
        game: true,
        user: true,
      },
    });
    if (!reviewItem) {
      return res.status(404).send("Review item not found");
    }
    res.json(reviewItem);
  } catch (error) {
    console.error('Error fetching review item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a review by ID (authentication required)
app.put("/review/:id", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const { id } = req.params;
  const { title, reviewContent, rating, gameName } = req.body;

  // Input validation
  if (!title || !reviewContent || !rating || !gameName) {
    return res.status(400).send("All fields are required!");
  }

  if (title.length < 5 || title.length > 100) {
    return res.status(400).send("Title must be between 5 and 100 characters.");
  }

  if (reviewContent.length < 20 || reviewContent.length > 1000) {
    return res.status(400).send("Review content must be between 20 and 1000 characters.");
  }

  // Validate rating is an integer within the expected range
  const ratingInt = parseInt(rating);
  if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
    return res.status(400).send("rating must be an integer between 1 and 5");
  }

  // if game not exist, create new 
  let game = await prisma.game.findUnique({
    where: { name: gameName },
  });
  if (!game) {
    game = await prisma.game.create({
      data: { name: gameName },
    });
  }

  try {
    // Find the review by ID
    const review = await prisma.reviewItem.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
      },
    });

    if (!review) {
      return res.status(404).send("Review not found");
    }

    // Check if the authenticated user is the owner of the review
    if (review.user.auth0Id !== auth0Id) {
      return res.status(403).send("You are not authorized to update this review");
    }

    // Find or create the game
    let game = await prisma.game.findUnique({
      where: { name: gameName },
    });
    if (!game) {
      game = await prisma.game.create({
        data: { name: gameName },
      });
    }

    // Update the review
    const updatedReview = await prisma.reviewItem.update({
      where: { id: parseInt(id) },
      data: {
        title: title,
        content: reviewContent,
        star: ratingInt,
        game: { connect: { id: game.id } },
      },
    });

    res.status(200).json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: error.message });
  }
});


// get Profile information of authenticated user
app.get("/me", requireAuth, async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const user = await prisma.user.findUnique({
      where: {
        auth0Id,
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: error.message });
  }
});


// update user's bio
app.put("/me/bio", requireAuth, async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { bio } = req.body;

    let user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user = await prisma.user.update({
      where: { auth0Id },
      data: { bio },
    });

    res.json(user);
  } catch (error) {
    console.error("Error updating bio:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get reviews for authenticated user
app.get("/me/reviews", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const reviews = await prisma.reviewItem.findMany({
      where: { userId: user.id },
      include: {
        game: true,
        user: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get most recent 20 games from IGDB(external API)
// Function to get OAuth token
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
let accessToken = '';
const getOAuthToken = async () => {
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });
    const data = await response.json();
    accessToken = data.access_token;
  } catch (error) {
    console.error('Error fetching OAuth token:', error);
  }
};
// Initial token fetch
getOAuthToken();

// Endpoint to fetch most recent 10 game data from IGDB
app.get('/recent-games', async (req, res) => {
  const currentDateInSeconds = Math.floor(Date.now() / 1000);
  try {
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: `fields name, first_release_date, summary, cover.url; sort first_release_date desc; where first_release_date < ${currentDateInSeconds} & cover != null; limit 10;`,
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching games from IGDB API:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get the list of users the current user is following
app.get('/me/followings', requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id },
      include: {
        followings: {
          select: {
            following: {
              select: {
                id: true,
                name: true,
                nickname: true,
                picture: true
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.followings.map(follow => follow.following));
  } catch (error) {
    console.error('Error fetching following users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get the list of users who are following the current user
app.get('/me/followers', requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id },
      include: {
        followers: {
          select: {
            follower: {
              select: {
                id: true,
                name: true,
                nickname: true,
                picture: true
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.followers.map(f => f.follower)); // Send only the follower user data
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Follow a user
app.post('/follow/:userId', requireAuth, async (req, res) => {
  const followerAuth0Id = req.auth.payload.sub;
  const followingId = parseInt(req.params.userId);

  try {
    const follower = await prisma.user.findUnique({ where: { auth0Id: followerAuth0Id } });
    if (!follower) {
      return res.status(404).json({ message: 'Follower not found' });
    }

    const following = await prisma.user.findUnique({ where: { id: followingId } });
    if (!following) {
      return res.status(404).json({ message: 'Following user not found' });
    }

    // Check if the follow record already exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: following.id,
        },
      },
    });

    if (existingFollow) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    // Create the follow record
    const follow = await prisma.follow.create({
      data: {
        followerId: follower.id,
        followingId: following.id,
      },
    });

    res.status(201).json(follow);
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: error.message });
  }
});


// Unfollow a user (authentication required)
app.delete('/follow/:userId', requireAuth, async (req, res) => {
  const followerAuth0Id = req.auth.payload.sub;
  const followingId = parseInt(req.params.userId);

  try {
    const follower = await prisma.user.findUnique({ where: { auth0Id: followerAuth0Id } });
    if (!follower) {
      return res.status(404).json({ message: 'Follower not found' });
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: follower.id,
        followingId: followingId,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: error.message });
  }
});


// this endpoint is used by the client to verify the user status and to make sure the user is registered in our database once they signup with Auth0
// if not registered in our database we will create it.
// if the user is already registered we will return the user information
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  // we are using the audience to get the email and name from the token
  // if your audience is different you should change the key to match your audience
  // the value should match your audience according to this document: https://docs.google.com/document/d/1lYmaGZAS51aeCxfPzCwZHIk6C5mmOJJ7yHBNPJuGimU/edit#heading=h.fr3s9fjui5yn
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];
  const nickname = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/nickname`];
  const picture = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/picture`];
  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email,
        auth0Id,
        name,
        nickname,
        picture,
        bio: ""
      },
    });

    res.json(newUser);
  }
});
const PORT = parseInt(process.env.PORT) || 8080;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}🎉 🚀`);
});
