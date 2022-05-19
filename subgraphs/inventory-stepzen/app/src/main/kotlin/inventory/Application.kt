package inventory

import graphql.GraphQL
import graphql.schema.idl.RuntimeWiring
import graphql.schema.idl.SchemaGenerator
import graphql.schema.idl.SchemaParser
import graphql.schema.idl.TypeRuntimeWiring.newTypeWiring
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.stereotype.Component
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.io.IOException
import javax.annotation.PostConstruct


@SpringBootApplication
class Application

fun main(args: Array<String>) {
    runApplication<Application>(*args)
}

@Component
class GraphQLProvider {
    private var graphQL: GraphQL? = null

    private val logger: Logger = LoggerFactory.getLogger(javaClass)

    @Bean
    fun graphQL(): GraphQL? {
        return graphQL
    }

    @PostConstruct
    @Throws(IOException::class)
    fun init() {
        val sdl: String = javaClass.getResource("/inventory.graphql")!!.readText()
        val typeRegistry = SchemaParser().parse(sdl)

        val runtimeWiring: RuntimeWiring = RuntimeWiring.newRuntimeWiring()
            .type(
                newTypeWiring("DeliveryEstimates")
                    .dataFetcher("estimatedDelivery") { environment ->
                        val product: Product = environment!!.getSource()
                        product.delivery.estimatedDelivery
                    }
                    .dataFetcher("fastestDelivery") { environment ->
                        val product: Product = environment!!.getSource()
                        product.delivery.fastestDelivery
                    }
            )
            .type(
                newTypeWiring("Query")
                    .dataFetcher("getDeliveryEstimates") { environment ->
                        val id: String = environment!!.getArgument("id")
                        allProducts.firstOrNull { it.id == id } ?: error("Product not found: $id")
                    }
            )
            .build();

        val schemaGenerator = SchemaGenerator()
        val schema = schemaGenerator.makeExecutableSchema(typeRegistry, runtimeWiring)
        graphQL = GraphQL.newGraphQL(schema).build()
    }
}

class Product(val id: String, val delivery: Delivery)
class Delivery(val estimatedDelivery: String, val fastestDelivery: String)

private val allProducts = listOf(
    Product("stepzen-federation", Delivery("6/25/2022", "6/1/2022")),
    Product("graphql-studio", Delivery("6/25/2022", "6/1/2022")),
)

/**
 * Enable CORS for all origins for Sandbox
 */
@Configuration
@EnableWebMvc
class WebConfig : WebMvcConfigurer {
    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/**")
    }
}
