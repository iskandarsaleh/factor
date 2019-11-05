import Factor from "vue"
import { themes } from "../themes"
import { deepMerge } from "@factor/tools/utils"
import axios from "axios"
export default () => {
  return new (class {
    constructor() {
      Factor.$filters.callback("endpoints", { id: "themedata", handler: this })
    }

    async getIndex(page = 1) {
      const slugs = themes

      const index = await Promise.all(slugs.map(async slug => this.getSingle(slug)))

      return index
    }

    async getSingle(slug) {
      let githubToken = process.env.GITHUB_TOKEN

      let cleanSlug = slug.replace("@factor/", "")

      const requests = [
        {
          _id: "npmData",
          url: `https://registry.npmjs.org/${slug}`
        },
        {
          _id: "npmDownloads",
          url: `https://api.npmjs.org/downloads/point/last-month/${slug}`
        },
        {
          _id: "githubFiles",
          url: `https://api.github.com/repos/fiction-com/factor/contents/@factor/@themes/${cleanSlug}`,
          options: {
            headers: {
              Authorization: `Bearer ${githubToken}`, //githubToken is a variable which holds the token
              "Content-Type": "application/json"
            }
          }
        }
      ]

      const results = await Promise.all(
        requests.map(async ({ url, options = {} }) => {
          return await axios.get(url, options)
        })
      )

      const merged = deepMerge(
        results.map((result, index) => {
          const _id = requests[index]._id
          return Array.isArray(result.data) ? { [_id]: result.data } : result.data
        })
      )

      return merged
    }

    // async getReadme(slug) {
    //   const results = await Promise.all([
    //     axios.get(`https://registry.npmjs.org/${slug}`),
    //     axios.get(`https://api.npmjs.org/downloads/point/last-month/${slug}`)
    //   ])

    //   const allData = deepMerge(results.map(r => r.data))

    //   return { myData: allData }
    // }
  })()
}