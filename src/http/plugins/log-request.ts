import fastifyPlugin from 'fastify-plugin'
import { redactQueryParamFromRequest } from '../../monitoring'
import { normalizeRawError } from '../../storage'

interface RequestLoggerOptions {
  excludeUrls?: string[]
}

declare module 'fastify' {
  interface FastifyReply {
    executionError?: Error
  }
}

export const logRequest = (options: RequestLoggerOptions) =>
  fastifyPlugin(async (fastify) => {
    fastify.addHook('onResponse', async (req, reply) => {
      if (options.excludeUrls?.includes(req.url)) {
        return
      }

      const rMeth = req.method
      const rUrl = redactQueryParamFromRequest(req, ['token'])
      const uAgent = req.headers['user-agent']
      const rId = req.id
      const cIP = req.ip
      const statusCode = reply.statusCode
      const error = (reply.raw as any).executionError || reply.executionError
      const tenantId = req.tenantId

      const buildLogMessage = `${tenantId} | ${rMeth} | ${statusCode} | ${cIP} | ${rId} | ${rUrl} | ${uAgent}`

      req.log.info(
        {
          req,
          res: reply,
          responseTime: reply.getResponseTime(),
          error,
          rawError: normalizeRawError(error),
        },
        buildLogMessage
      )
    })
  })
