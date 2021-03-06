<template>
  <dashboard-page :title="_id == userId() ? 'Your Account' : 'Edit User'">
    <template #actions>
      <dashboard-btn btn="primary" :loading="sending" @click="save()">Update</dashboard-btn>
    </template>
    <template #meta>
      <dashboard-panel title="Images" class="compose inputs">
        <dashboard-input
          v-model="post.avatar"
          max="1"
          input="factor-input-image-upload"
          label="Avatar"
          :loading="loading"
          @autosave="$emit('autosave')"
        />
        <dashboard-input
          v-model="post.images"
          max="5"
          min="1"
          input="factor-input-image-upload"
          label="Profile Photo(s)"
          :loading="loading"
          @autosave="$emit('autosave')"
        />
        <dashboard-input
          v-model="post.covers"
          max="5"
          min="1"
          input="factor-input-image-upload"
          label="Cover Photo(s)"
          :loading="loading"
          @autosave="$emit('autosave')"
        />
      </dashboard-panel>
    </template>
    <template #primary>
      <dashboard-panel title="Account Info" class="compose inputs">
        <dashboard-input
          v-model="post.displayName"
          input="factor-input-text"
          label="Display Name"
          class="post-title"
        />

        <dashboard-input
          v-model="post.email"
          class="email-inputs"
          input="factor-input-email"
          label="Email Address"
        >
          <div v-if="post.email && !post.emailVerified" class="verify-email">
            <dashboard-btn
              size="small"
              btn="primary"
              :loading="sending"
              @click="sendVerifyEmail()"
            >Unverified - Resend Email &rarr;</dashboard-btn>
          </div>
        </dashboard-input>

        <dashboard-input
          v-model="post.username"
          input="factor-input-text"
          label="Username"
          description="Must be unique."
        />

        <dashboard-input
          v-model="post.password"
          input="factor-input-password"
          label="Update Password"
          autocomplete="new-password"
        />
      </dashboard-panel>
    </template>
    <template #secondary>
      <dashboard-panel title="Profile" class="inputs">
        <dashboard-input v-model="post.about" input="factor-input-textarea" label="About You" />
        <dashboard-input
          v-model="post.birthday"
          input="factor-input-birthday"
          label="Birthday"
          description="This information is not shared."
        />
        <dashboard-input
          v-model="post.gender"
          :list="['female', 'male']"
          input="factor-input-select"
          label="Gender"
          description="This information is not shared."
        />
        <div class="user-info">
          <div class="item">
            <div class="label">Logged In</div>
            <div class="value">{{ standardDate(post.signedInAt) }}</div>
          </div>

          <div class="item">
            <div class="label">Signed up</div>
            <div class="value">{{ standardDate(post.createdAt) }}</div>
          </div>
          <div v-if="geo.name" class="item">
            <div class="label">Location</div>
            <div class="value">{{ geo.name }}</div>
          </div>
          <div v-if="geo.ip" class="item">
            <div class="label">IP</div>
            <div class="value">{{ geo.ip }}</div>
          </div>
        </div>
      </dashboard-panel>
    </template>
  </dashboard-page>
</template>
<script lang="ts">
import { dashboardPage, dashboardPanel, dashboardInput, dashboardBtn } from "@factor/ui"

import { userId } from "@factor/user"
import { sendVerifyEmail } from "@factor/user/email-request"
import { standardDate, emitEvent, stored, storeItem, currentUserId } from "@factor/api"
import { requestPostSave } from "@factor/post/request"
import { FactorPost } from "@factor/post/types"

export default {
  components: {
    dashboardPage,
    dashboardPanel,
    dashboardInput,
    dashboardBtn,
  },
  data() {
    return {
      sending: false,
      loading: false,
      postType: "user",
    }
  },
  computed: {
    post: {
      get(this: any): FactorPost {
        return stored(this._id) || {}
      },
      set(this: any, v: FactorPost): void {
        storeItem(this._id, v)
      },
    },

    profile(this: any) {
      return this.post.profile || {}
    },
    _id(this: any) {
      return this.$route.query._id || userId()
    },
    url(this: any) {
      return this.post.username ? `/@${this.post.username}` : `/@?_id=${this.post._id}`
    },
    geo(this: any) {
      return this.post.geo ?? {}
    },
  },

  methods: {
    userId,
    standardDate,
    async sendVerifyEmail(this: any) {
      this.sending = true
      await sendVerifyEmail({
        email: this.post.email,
        _id: this.post._id,
      })
      this.sending = false
    },
    async save(this: any) {
      this.sending = true

      try {
        let post = this.post
        // Set geo information if user is saving their own account, not admins!
        if (currentUserId() == this.post._id) {
          post = { geo: this.geo, ...this.post }
        }

        const saved = await requestPostSave({
          post,
          postType: this.postType,
        })

        if (saved) {
          this.post = saved
          emitEvent("notify", `Saved!`)
        }
      } catch (error) {
        this.sending = false
        throw error
      }

      this.sending = false
    },
  },
}
</script>

<style lang="less">
.user-dashboard-post-grid {
  display: grid;

  .content-column,
  .meta-column {
    min-width: 0;
    @media (max-width: 960px) {
      grid-column: span 3;
    }
  }
  @media (max-width: 960px) {
    .meta-column {
      .foot {
        justify-content: center;
      }
    }
  }

  .meta-column {
    .post-actions {
      position: sticky;
      top: 1em;
      @media (max-width: 767px) {
        position: fixed;
        bottom: 0;
        top: auto;
        width: 100%;
        left: 0;
      }
    }
  }
  .compose .cont {
    min-height: 20vh;
  }
}

.email-inputs {
  .verify-email {
    margin-top: 0.5rem;
  }
}
.user-info {
  list-style: none;
  line-height: 1.5;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 1rem;
  margin: 4em 0;
  .label {
    opacity: 0.4;
    font-weight: var(--font-weight-bold);
  }
}
</style>
